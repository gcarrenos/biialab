import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { certificates } from '@/lib/db/schema';
import { retrieveCheckoutSession } from '@/lib/payments/stripe';

export const maxDuration = 30;

// Stripe success_url target. Confirms payment server-side (the session is
// retrieved with the secret key, so the session_id in the URL can't be forged
// into a paid state) and unlocks the certificate. No webhook required.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  try {
    const session = await retrieveCheckoutSession(sessionId);
    const certificateNumber = session.metadata?.certificate_number;

    if (!certificateNumber) {
      return NextResponse.redirect(new URL('/', url.origin));
    }

    if (session.payment_status === 'paid') {
      const cert = await db.query.certificates.findFirst({
        where: eq(certificates.certificateNumber, certificateNumber),
      });
      if (cert && cert.paidAt === null) {
        await db.update(certificates)
          .set({ paidAt: new Date(), stripeSessionId: session.id })
          .where(eq(certificates.id, cert.id));
      }
      return NextResponse.redirect(new URL(`/verify/${certificateNumber}?unlocked=1`, url.origin));
    }

    return NextResponse.redirect(new URL(`/verify/${certificateNumber}`, url.origin));
  } catch (error) {
    console.error('certificate confirm error:', error);
    return NextResponse.redirect(new URL('/', url.origin));
  }
}
