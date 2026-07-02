'use server';

import { headers } from 'next/headers';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { certificates, courses, users } from '@/lib/db/schema';

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

function generateCertificateNumber() {
  const block = () => crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `BIIA-${block()}-${block()}-${block()}`;
}

// Issues a certificate for (userId, courseId) if none exists. Called
// server-side only (from the exam grading path) — never exposed with a
// client-controlled userId.
export async function issueCertificateForUser(userId: string, courseId: string) {
  const existing = await db.query.certificates.findFirst({
    where: and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)),
  });
  if (existing) return existing;

  const [created] = await db.insert(certificates).values({
    userId,
    courseId,
    certificateNumber: generateCertificateNumber(),
  }).returning();
  return created;
}

export interface MyCertificate {
  certificateNumber: string;
  courseTitle: string;
  courseSlug: string;
  issuedAt: string;
}

export async function getMyCertificates() {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' as const, certificates: [] as MyCertificate[] };

  try {
    const rows = await db.query.certificates.findMany({
      where: eq(certificates.userId, user.id),
      orderBy: (c, { desc }) => [desc(c.issuedAt)],
    });
    if (rows.length === 0) return { success: true as const, certificates: [] as MyCertificate[] };

    const courseRows = await db.query.courses.findMany({
      where: inArray(courses.id, rows.map((r) => r.courseId)),
    });
    const courseById = new Map(courseRows.map((c) => [c.id, c]));

    return {
      success: true as const,
      certificates: rows.flatMap((r): MyCertificate[] => {
        const course = courseById.get(r.courseId);
        return course ? [{
          certificateNumber: r.certificateNumber,
          courseTitle: course.title,
          courseSlug: course.slug,
          issuedAt: r.issuedAt.toISOString(),
        }] : [];
      }),
    };
  } catch (error) {
    console.error('getMyCertificates error:', error);
    return { success: false as const, error: 'server' as const, certificates: [] as MyCertificate[] };
  }
}

// Public verification lookup by credential number (no auth — this is the
// page employers/LinkedIn visitors open).
export async function getCertificateByNumber(certificateNumber: string) {
  try {
    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.certificateNumber, certificateNumber.toUpperCase()),
    });
    if (!cert) return { success: true as const, certificate: null };

    const [course, user] = await Promise.all([
      db.query.courses.findFirst({ where: eq(courses.id, cert.courseId) }),
      db.query.users.findFirst({ where: eq(users.id, cert.userId) }),
    ]);
    if (!course || !user) return { success: true as const, certificate: null };

    return {
      success: true as const,
      certificate: {
        certificateNumber: cert.certificateNumber,
        issuedAt: cert.issuedAt.toISOString(),
        courseTitle: course.title,
        courseSlug: course.slug,
        courseCategory: course.category,
        totalLessons: course.totalLessons,
        studentName: user.name,
      },
    };
  } catch (error) {
    console.error('getCertificateByNumber error:', error);
    return { success: false as const, error: 'server' as const, certificate: null };
  }
}
