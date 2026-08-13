import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { certificates, courses, users } from '@/lib/db/schema';
import { issueCertificateForUser } from '@/lib/db/actions/certificates';
import { createCertificateCheckout, paymentsEnabled } from '@/lib/payments/stripe';

const TEST_USER_EMAIL = 'certificado-prueba@biialab.org';

// Issues a certificate to a dedicated test user so admins can exercise the
// /verify page and the LinkedIn share flow without taking an exam.
// Idempotent per course (repeat calls return the same credential) unless
// `reissue` is set, which deletes the test user's cert for that course first
// so the fresh one starts unpaid (paywall testing). When the paywall is on
// and the cert is unpaid, the response includes a Stripe checkoutUrl so the
// payment flow can be tested without logging in as the test user.
export async function POST(request: Request) {
  try {
    const { password, courseSlug, reissue } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const course = courseSlug
      ? await db.query.courses.findFirst({ where: eq(courses.slug, courseSlug) })
      : await db.query.courses.findFirst({ where: eq(courses.status, 'published') });
    if (!course) {
      return NextResponse.json({ success: false, message: 'Course not found' }, { status: 404 });
    }

    let testUser = await db.query.users.findFirst({ where: eq(users.email, TEST_USER_EMAIL) });
    if (!testUser) {
      const [created] = await db.insert(users).values({
        email: TEST_USER_EMAIL,
        name: 'Certificado de Prueba',
        emailVerified: false,
      }).returning();
      testUser = created;
    }

    if (reissue) {
      await db.delete(certificates).where(
        and(eq(certificates.userId, testUser.id), eq(certificates.courseId, course.id)),
      );
    }

    const cert = await issueCertificateForUser(testUser.id, course.id);

    // With the paywall on and this cert unpaid, hand back a checkout link so
    // the admin can test the full payment flow (use a Stripe test key + the
    // 4242 test card — with a live key this charges real money).
    let checkoutUrl: string | null = null;
    if (paymentsEnabled() && cert.paidAt === null) {
      try {
        const checkout = await createCertificateCheckout({
          certificateNumber: cert.certificateNumber,
          courseTitle: course.title,
          customerEmail: TEST_USER_EMAIL,
          origin: new URL(request.url).origin,
        });
        checkoutUrl = checkout.url;
      } catch (error) {
        console.error('test-certificate checkout error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      certificateNumber: cert.certificateNumber,
      courseTitle: course.title,
      url: `https://www.biialab.org/verify/${cert.certificateNumber}`,
      checkoutUrl,
    });
  } catch (error) {
    console.error('Test certificate error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
