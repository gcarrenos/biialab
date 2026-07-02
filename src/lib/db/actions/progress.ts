'use server';

import { headers } from 'next/headers';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { enrollments, lessonProgress, lessons, modules, courses } from '@/lib/db/schema';

// Session user for server actions. Server actions are public endpoints, so
// every mutation below derives the user from the session — never from args.
async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function enrollInCourse(courseId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' };

  try {
    const existing = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)),
    });
    if (existing) return { success: true as const, alreadyEnrolled: true };

    await db.insert(enrollments).values({ userId: user.id, courseId });
    return { success: true as const, alreadyEnrolled: false };
  } catch (error) {
    console.error('enrollInCourse error:', error);
    return { success: false as const, error: 'server' };
  }
}

export async function markLessonComplete(lessonId: string, completed: boolean = true) {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' };

  try {
    const existing = await db.query.lessonProgress.findFirst({
      where: and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonId, lessonId)),
    });

    if (existing) {
      await db.update(lessonProgress)
        .set({ completed, completedAt: completed ? new Date() : null, updatedAt: new Date() })
        .where(eq(lessonProgress.id, existing.id));
    } else {
      await db.insert(lessonProgress).values({
        userId: user.id,
        lessonId,
        completed,
        completedAt: completed ? new Date() : null,
      });
    }
    return { success: true as const };
  } catch (error) {
    console.error('markLessonComplete error:', error);
    return { success: false as const, error: 'server' };
  }
}

// Lesson ids belonging to a course (via its modules)
async function courseLessonIds(courseId: string): Promise<string[]> {
  const mods = await db.query.modules.findMany({ where: eq(modules.courseId, courseId) });
  if (mods.length === 0) return [];
  const rows = await db.query.lessons.findMany({
    where: inArray(lessons.moduleId, mods.map((m) => m.id)),
  });
  return rows.map((r) => r.id);
}

export async function getCourseProgress(courseId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' };

  try {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, user.id), eq(enrollments.courseId, courseId)),
    });

    const ids = await courseLessonIds(courseId);
    let completedLessonIds: string[] = [];
    if (ids.length > 0) {
      const rows = await db.query.lessonProgress.findMany({
        where: and(
          eq(lessonProgress.userId, user.id),
          eq(lessonProgress.completed, true),
          inArray(lessonProgress.lessonId, ids)
        ),
      });
      completedLessonIds = rows.map((r) => r.lessonId);
    }

    return { success: true as const, enrolled: !!enrollment, completedLessonIds };
  } catch (error) {
    console.error('getCourseProgress error:', error);
    return { success: false as const, error: 'server' };
  }
}

export interface LearningEntry {
  courseId: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  category: string | null;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
}

export async function getMyLearning() {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' as const, entries: [] as LearningEntry[] };

  try {
    const myEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, user.id),
      orderBy: (e, { desc }) => [desc(e.enrolledAt)],
    });
    if (myEnrollments.length === 0) return { success: true as const, entries: [] as LearningEntry[] };

    const courseRows = await db.query.courses.findMany({
      where: inArray(courses.id, myEnrollments.map((e) => e.courseId)),
    });
    const courseById = new Map(courseRows.map((c) => [c.id, c]));

    const entries: LearningEntry[] = [];
    for (const enrollment of myEnrollments) {
      const course = courseById.get(enrollment.courseId);
      if (!course) continue;
      const ids = await courseLessonIds(course.id);
      let completed = 0;
      if (ids.length > 0) {
        const rows = await db.query.lessonProgress.findMany({
          where: and(
            eq(lessonProgress.userId, user.id),
            eq(lessonProgress.completed, true),
            inArray(lessonProgress.lessonId, ids)
          ),
        });
        completed = rows.length;
      }
      entries.push({
        courseId: course.id,
        slug: course.slug,
        title: course.title,
        thumbnail: course.thumbnail,
        category: course.category,
        totalLessons: ids.length || course.totalLessons || 0,
        completedLessons: completed,
        enrolledAt: enrollment.enrolledAt.toISOString(),
      });
    }

    return { success: true as const, entries };
  } catch (error) {
    console.error('getMyLearning error:', error);
    return { success: false as const, error: 'server' as const, entries: [] as LearningEntry[] };
  }
}
