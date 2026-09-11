import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';

export const maxDuration = 30;
// Stripe verifies against the raw body, so this route must never be statically
// optimised or have its body pre-parsed.
export const dynamic = 'force-dynamic';

// Source of truth for "this certificate was paid".
//
// The success_url route (api/checkout/certificate/confirm) only runs if the
// buyer's browser comes back from Stripe. When it doesn't -- tab closed, network
// dropped, app switched away on mobile -- Stripe has the money and the database
// never learns about it. Stripe retries webhook delivery for up to 3 days, so
// this records the payment regardless of what the browser does.
//
// IMPORTANT: this Stripe account is shared with other businesses, so the endpoint
// receives checkout events that have nothing to do with BiiA LAB. Every handler
// must confirm our own metadata before touching anything.

const TOLERANCE_SECONDS = 300;

// Stripe's scheme: header `t=<unix>,v1=<hex hmac>` signed over `<t>.<raw body>`.
// Implemented directly to keep the Stripe SDK out of the project, matching
// src/lib/payments/stripe.ts.
function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Reject replays of an old but once-valid payload.
  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > TOLERANCE_SECONDS) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('stripe webhook: STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('stripe-signature'), secret)) {
    // Without this check anyone could POST a fake "paid" event and unlock
    // certificates for free.
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data?.object ?? {};
  const metadata = (session.metadata ?? {}) as Record<string, string>;
  const certificateNumber = metadata.certificate_number;

  // Shared-account guard: no BiiA LAB metadata means the event belongs to another
  // business on this Stripe account. Acknowledge and do nothing.
  if (!certificateNumber) {
    return NextResponse.json({ received: true, ignored: 'not_a_biialab_certificate' });
  }

  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true, ignored: `payment_status=${session.payment_status}` });
  }

  try {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.certificateNumber, certificateNumber),
    });

    if (!cert) {
      // Money taken for a certificate that no longer exists (e.g. reissued while
      // testing). Log loudly -- this needs a human, not a silent 200.
      console.error(`stripe webhook: paid session for unknown certificate ${certificateNumber}`);
      return NextResponse.json({ received: true, warning: 'certificate_not_found' });
    }

    // Idempotent: the confirm route may already have unlocked it, and Stripe
    // retries deliveries. Only the first writer sets paid_at.
    if (cert.paidAt === null) {
      await db.update(certificates)
        .set({ paidAt: new Date(), stripeSessionId: String(session.id ?? '') })
        .where(eq(certificates.id, cert.id));
      console.log(`stripe webhook: unlocked ${certificateNumber} via ${session.id}`);
    }

    return NextResponse.json({ received: true, certificateNumber, unlocked: true });
  } catch (error) {
    // A 500 makes Stripe retry, which is what we want for a transient DB failure.
    console.error('stripe webhook: database error', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
