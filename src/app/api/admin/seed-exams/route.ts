import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { quizzes, quizQuestions, courses } from '@/lib/db/schema';

export const maxDuration = 60;

interface SeedExamQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface SeedExam {
  courseSlug: string;
  title: string;
  description?: string;
  passingScore?: number;
  questions: SeedExamQuestion[];
}

// Upserts one final exam per course: re-posting replaces the questions
// (attempts reference the quiz id, which is preserved). Admin-gated.
export async function POST(request: Request) {
  try {
    const { password, exams } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (!Array.isArray(exams) || exams.length === 0) {
      return NextResponse.json({ success: false, message: 'No exams provided' }, { status: 400 });
    }

    const valid = (exams as SeedExam[]).every((e) =>
      e && typeof e.courseSlug === 'string' && typeof e.title === 'string' &&
      Array.isArray(e.questions) && e.questions.length >= 3 &&
      e.questions.every((q) =>
        typeof q.question === 'string' && Array.isArray(q.options) && q.options.length >= 2 &&
        Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length
      )
    );
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Invalid exams payload' }, { status: 400 });
    }

    const results: { courseSlug: string; status: 'created' | 'updated' | 'failed'; error?: string }[] = [];

    for (const seed of exams as SeedExam[]) {
      try {
        const course = await db.query.courses.findFirst({ where: eq(courses.slug, seed.courseSlug) });
        if (!course) {
          results.push({ courseSlug: seed.courseSlug, status: 'failed', error: 'course not found' });
          continue;
        }

        let quiz = await db.query.quizzes.findFirst({ where: eq(quizzes.courseId, course.id) });
        let status: 'created' | 'updated';
        if (quiz) {
          await db.update(quizzes)
            .set({ title: seed.title, description: seed.description ?? null, passingScore: seed.passingScore ?? 70, updatedAt: new Date() })
            .where(eq(quizzes.id, quiz.id));
          await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quiz.id));
          status = 'updated';
        } else {
          const [created] = await db.insert(quizzes).values({
            courseId: course.id,
            title: seed.title,
            description: seed.description,
            passingScore: seed.passingScore ?? 70,
          }).returning();
          quiz = created;
          status = 'created';
        }

        await db.insert(quizQuestions).values(
          seed.questions.map((q, i) => ({
            quizId: quiz!.id,
            question: q.question,
            options: q.options,
            correctOptionIndex: q.correctIndex,
            explanation: q.explanation ?? null,
            sortOrder: i,
          }))
        );

        results.push({ courseSlug: seed.courseSlug, status });
      } catch (error) {
        results.push({ courseSlug: seed.courseSlug, status: 'failed', error: String(error).slice(0, 200) });
      }
    }

    const failed = results.filter((r) => r.status === 'failed');
    return NextResponse.json({
      success: failed.length === 0,
      created: results.filter((r) => r.status === 'created').length,
      updated: results.filter((r) => r.status === 'updated').length,
      failed,
    });
  } catch (error) {
    console.error('Seed exams error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
