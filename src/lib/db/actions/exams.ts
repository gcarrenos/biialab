'use server';

import { headers } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { quizzes, quizQuestions, quizAttempts, courses } from '@/lib/db/schema';
import { issueCertificateForUser } from '@/lib/db/actions/certificates';

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export interface PublicExamQuestion {
  id: string;
  question: string;
  options: string[];
}

// Exam for a course (by id or slug). Questions are returned WITHOUT the
// correct answers — grading happens server-side only.
export async function getCourseExam(courseIdOrSlug: string) {
  try {
    const course =
      (await db.query.courses.findFirst({ where: eq(courses.slug, courseIdOrSlug) })) ??
      (/^[0-9a-f-]{36}$/.test(courseIdOrSlug)
        ? await db.query.courses.findFirst({ where: eq(courses.id, courseIdOrSlug) })
        : undefined);
    if (!course) return { success: true as const, exam: null };

    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.courseId, course.id) });
    if (!quiz) return { success: true as const, exam: null };

    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quiz.id),
      orderBy: (q, { asc }) => [asc(q.sortOrder)],
    });

    return {
      success: true as const,
      exam: {
        quizId: quiz.id,
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        title: quiz.title,
        description: quiz.description,
        passingScore: quiz.passingScore ?? 70,
        questions: questions.map((q): PublicExamQuestion => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
      },
    };
  } catch (error) {
    console.error('getCourseExam error:', error);
    return { success: false as const, error: 'server', exam: null };
  }
}

// Grades an attempt server-side and stores it. answers: questionId -> optionIndex.
export async function submitExamAttempt(quizId: string, answers: Record<string, number>) {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' as const };

  try {
    const quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.id, quizId) });
    if (!quiz) return { success: false as const, error: 'not_found' as const };

    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.quizId, quizId),
    });
    if (questions.length === 0) return { success: false as const, error: 'not_found' as const };

    let correct = 0;
    const feedback: { questionId: string; correct: boolean; correctOptionIndex: number; explanation: string | null }[] = [];
    for (const q of questions) {
      const isCorrect = answers[q.id] === q.correctOptionIndex;
      if (isCorrect) correct++;
      feedback.push({
        questionId: q.id,
        correct: isCorrect,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      });
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (quiz.passingScore ?? 70);

    await db.insert(quizAttempts).values({
      userId: user.id,
      quizId,
      score,
      passed,
      answers,
    });

    // Passing the final exam earns the course certificate (idempotent)
    let certificateNumber: string | null = null;
    if (passed && quiz.courseId) {
      try {
        const cert = await issueCertificateForUser(user.id, quiz.courseId);
        certificateNumber = cert.certificateNumber;
      } catch (error) {
        console.error('certificate issuance error:', error);
      }
    }

    return { success: true as const, score, passed, correctCount: correct, total: questions.length, feedback, certificateNumber };
  } catch (error) {
    console.error('submitExamAttempt error:', error);
    return { success: false as const, error: 'server' as const };
  }
}

export async function getMyBestAttempt(quizId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false as const, error: 'unauthenticated' as const, best: null };

  try {
    const attempts = await db.query.quizAttempts.findMany({
      where: and(eq(quizAttempts.userId, user.id), eq(quizAttempts.quizId, quizId)),
      orderBy: (a, { desc }) => [desc(a.score)],
      limit: 1,
    });
    const best = attempts[0] ?? null;
    return {
      success: true as const,
      best: best ? { score: best.score, passed: best.passed, attemptedAt: best.attemptedAt.toISOString() } : null,
    };
  } catch (error) {
    console.error('getMyBestAttempt error:', error);
    return { success: false as const, error: 'server' as const, best: null };
  }
}
