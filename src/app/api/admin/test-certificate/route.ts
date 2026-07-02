import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { courses, users } from '@/lib/db/schema';
import { issueCertificateForUser } from '@/lib/db/actions/certificates';

const TEST_USER_EMAIL = 'certificado-prueba@biialab.org';

// Issues a certificate to a dedicated test user so admins can exercise the
// /verify page and the LinkedIn share flow without taking an exam.
// Idempotent per course (repeat calls return the same credential).
export async function POST(request: Request) {
  try {
    const { password, courseSlug } = await request.json();

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

    const cert = await issueCertificateForUser(testUser.id, course.id);

    return NextResponse.json({
      success: true,
      certificateNumber: cert.certificateNumber,
      courseTitle: course.title,
      url: `https://www.biialab.org/verify/${cert.certificateNumber}`,
    });
  } catch (error) {
    console.error('Test certificate error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
