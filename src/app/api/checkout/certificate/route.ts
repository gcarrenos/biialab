import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { certificates, courses } from '@/lib/db/schema';
import { createCertificateCheckout, paymentsEnabled } from '@/lib/payments/stripe';

export const maxDuration = 30;

// Starts a Stripe Checkout for unlocking the caller's own certificate.
// Body: { certificateNumber }. Returns { url } to redirect to.
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const { certificateNumber } = await request.json();
    if (typeof certificateNumber !== 'string' || !certificateNumber) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    const cert = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.certificateNumber, certificateNumber.toUpperCase()),
        eq(certificates.userId, user.id),
      ),
    });
    if (!cert) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!paymentsEnabled() || cert.paidAt !== null) {
      return NextResponse.json({ alreadyUnlocked: true });
    }

    const course = await db.query.courses.findFirst({ where: eq(courses.id, cert.courseId) });
    const origin = new URL(request.url).origin;

    const checkout = await createCertificateCheckout({
      certificateNumber: cert.certificateNumber,
      courseTitle: course?.title ?? 'Curso BiiA LAB',
      customerEmail: user.email,
      origin,
    });

    await db.update(certificates)
      .set({ stripeSessionId: checkout.id })
      .where(eq(certificates.id, cert.id));

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error('certificate checkout error:', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
