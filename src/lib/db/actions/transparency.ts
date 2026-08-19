import { and, count, countDistinct, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  certificates,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  modules,
  quizAttempts,
  users,
} from '@/lib/db/schema';

export type TransparencyCourse = {
  slug: string;
  title: string;
  lessons: number;
  students: number;
  certificates: number;
};

export type TransparencyMetrics = {
  generatedAt: string;
  courses: {
    published: number;
    lessons: number;
    list: TransparencyCourse[];
  };
  students: {
    registered: number;
    enrolled: number;
    enrollments: number;
    lessonsCompleted: number;
  };
  exams: {
    attempts: number;
    passed: number;
  };
  certificates: {
    issued: number;
    recent: { code: string; issuedAt: string; course: string }[];
  };
  timeline: { month: string; enrollments: number; certificates: number }[];
};

/**
 * Public, aggregate-only platform metrics. Nothing user-identifying is returned
 * (certificate codes are already public via /verify). Every number is computed
 * live from the database so it can never be hand-inflated.
 */
export async function getTransparencyMetrics(): Promise<TransparencyMetrics> {
  const published = eq(courses.status, 'published');

  const [
    [courseCount],
    [lessonCount],
    [userCount],
    [enrollmentStats],
    [lessonsDone],
    [attemptStats],
    [certCount],
    recentCerts,
    perCourse,
    enrollByMonth,
    certByMonth,
  ] = await Promise.all([
    db.select({ n: count() }).from(courses).where(published),
    db
      .select({ n: count() })
      .from(lessons)
      .innerJoin(modules, eq(lessons.moduleId, modules.id))
      .innerJoin(courses, eq(modules.courseId, courses.id))
      .where(published),
    db.select({ n: count() }).from(users),
    db
      .select({ enrollments: count(), enrolled: countDistinct(enrollments.userId) })
      .from(enrollments),
    db
      .select({ n: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.completed, true)),
    db
      .select({
        attempts: count(),
        passed: sql<number>`count(*) filter (where ${quizAttempts.passed})`.mapWith(Number),
      })
      .from(quizAttempts),
    db.select({ n: count() }).from(certificates),
    db
      .select({
        code: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        course: courses.title,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .orderBy(desc(certificates.issuedAt))
      .limit(5),
    db
      .execute(
        sql`
          select
            c.slug,
            c.title,
            (select count(*)::int from lessons l
               inner join modules m on l.module_id = m.id
             where m.course_id = c.id) as lessons,
            (select count(*)::int from enrollments e where e.course_id = c.id) as students,
            (select count(*)::int from certificates ce where ce.course_id = c.id) as certificates
          from courses c
          where c.status = 'published'
          order by c.title
        `,
      )
      .then((r) =>
        (r.rows as Array<Record<string, unknown>>).map((row) => ({
          slug: String(row.slug),
          title: String(row.title),
          lessons: Number(row.lessons),
          students: Number(row.students),
          certificates: Number(row.certificates),
        })),
      ),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${enrollments.enrolledAt}), 'YYYY-MM')`,
        n: count(),
      })
      .from(enrollments)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${certificates.issuedAt}), 'YYYY-MM')`,
        n: count(),
      })
      .from(certificates)
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);

  const months = new Map<string, { enrollments: number; certificates: number }>();
  for (const r of enrollByMonth) {
    months.set(r.month, { enrollments: Number(r.n), certificates: 0 });
  }
  for (const r of certByMonth) {
    const cur = months.get(r.month) ?? { enrollments: 0, certificates: 0 };
    cur.certificates = Number(r.n);
    months.set(r.month, cur);
  }
  const timeline = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  return {
    generatedAt: new Date().toISOString(),
    courses: {
      published: Number(courseCount?.n ?? 0),
      lessons: Number(lessonCount?.n ?? 0),
      list: perCourse,
    },
    students: {
      registered: Number(userCount?.n ?? 0),
      enrolled: Number(enrollmentStats?.enrolled ?? 0),
      enrollments: Number(enrollmentStats?.enrollments ?? 0),
      lessonsCompleted: Number(lessonsDone?.n ?? 0),
    },
    exams: {
      attempts: Number(attemptStats?.attempts ?? 0),
      passed: Number(attemptStats?.passed ?? 0),
    },
    certificates: {
      issued: Number(certCount?.n ?? 0),
      recent: recentCerts.map((c) => ({
        code: c.code,
        issuedAt: c.issuedAt.toISOString(),
        course: c.course,
      })),
    },
    timeline,
  };
}

const EMPTY: TransparencyMetrics = {
  generatedAt: new Date(0).toISOString(),
  courses: { published: 0, lessons: 0, list: [] },
  students: { registered: 0, enrolled: 0, enrollments: 0, lessonsCompleted: 0 },
  exams: { attempts: 0, passed: 0 },
  certificates: { issued: 0, recent: [] },
  timeline: [],
};

/** Same as getTransparencyMetrics but never throws (build-time / DB-down safe). */
export async function getTransparencyMetricsSafe(): Promise<TransparencyMetrics> {
  try {
    return await getTransparencyMetrics();
  } catch (err) {
    console.error('Failed query transparency metrics', err);
    return EMPTY;
  }
}
