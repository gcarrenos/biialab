'use client';

import { useEffect, useMemo, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getCourseExam, submitExamAttempt, PublicExamQuestion } from '@/lib/db/actions/exams';
import { track } from '@/lib/analytics';

type Exam = NonNullable<Awaited<ReturnType<typeof getCourseExam>>['exam']>;
type Result = Extract<Awaited<ReturnType<typeof submitExamAttempt>>, { success: true }>;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [round, setRound] = useState(0); // reshuffles on retry

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    getCourseExam(id)
      .then((res) => {
        setExam(res.exam);
        if (res.exam) track('exam_start', { course: id });
      })
      .finally(() => setLoading(false));
  }, [id, authLoading, isAuthenticated, router]);

  const questions: PublicExamQuestion[] = useMemo(
    () => (exam ? shuffle(exam.questions) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle per round
    [exam, round]
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-text-primary mb-3">Este curso aún no tiene examen final</h1>
          <p className="text-text-secondary mb-6">Estamos preparándolo. Mientras tanto, sigue avanzando con las lecciones.</p>
          <Link href={`/courses/${id}`} className="text-accent hover:underline">← Volver al curso</Link>
        </div>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length && questions.length > 0;
  const feedbackByQ = new Map((result?.feedback ?? []).map((f) => [f.questionId, f]));

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    const res = await submitExamAttempt(exam.quizId, answers);
    if (res.success) {
      setResult(res);
      track('exam_submit', { course: id, passed: res.passed, score: res.score });
    }
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setRound((r) => r + 1);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14">
        <Link href={`/courses/${exam.courseSlug}`} className="text-sm text-text-secondary hover:text-accent">
          ← {exam.courseTitle}
        </Link>
        <h1 className="mt-2 text-2xl md:text-3xl font-bold text-text-primary">{exam.title}</h1>
        <p className="mt-2 text-text-secondary text-sm">
          {questions.length} preguntas · Aprobación: {exam.passingScore}% · Puedes intentarlo las veces que necesites.
        </p>

        {/* Result banner */}
        {result && (
          <div className={`mt-6 p-6 rounded-xl border ${result.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <h2 className={`text-xl font-bold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
              {result.passed ? '¡Aprobado!' : 'No aprobado'}
            </h2>
            <p className="text-text-secondary mt-1">
              Tu puntaje: <strong className="text-text-primary">{result.score}%</strong> ({result.correctCount}/{result.total} correctas)
              {!result.passed && ` — necesitas ${exam.passingScore}%.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {result.passed && result.certificateNumber && (
                <Link
                  href={`/verify/${result.certificateNumber}`}
                  className="px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-500 transition-colors"
                >
                  Ver mi certificado
                </Link>
              )}
              {!result.passed && (
                <button onClick={handleRetry} className="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
                  Intentar de nuevo
                </button>
              )}
              <Link href={`/courses/${exam.courseSlug}`} className="px-5 py-2.5 border border-gray-300 text-text-primary text-sm font-medium rounded-lg hover:border-accent transition-colors">
                Volver al curso
              </Link>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="mt-8 space-y-6">
          {questions.map((q, qi) => {
            const fb = feedbackByQ.get(q.id);
            return (
              <div key={q.id} className="bg-surface border border-gray-200 rounded-xl shadow-sm p-6">
                <p className="font-medium text-text-primary mb-4">
                  <span className="text-accent mr-2">{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q.id] === oi;
                    let cls = selected ? 'border-accent bg-accent/5 text-text-primary' : 'border-gray-300 bg-white text-text-secondary hover:border-gray-400';
                    if (fb) {
                      if (oi === fb.correctOptionIndex) cls = 'border-green-400 bg-green-50 text-green-700';
                      else if (selected && !fb.correct) cls = 'border-red-400 bg-red-50 text-red-700';
                      else cls = 'border-gray-200 text-text-secondary opacity-60';
                    }
                    return (
                      <button
                        key={oi}
                        disabled={!!result}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {fb?.explanation && (
                  <p className="mt-3 text-xs text-text-secondary border-t border-gray-200 pt-3">{fb.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        {!result && (
          <div className="mt-8 flex items-center justify-between">
            <span className="text-sm text-text-secondary">{answered}/{questions.length} respondidas</span>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Calificando…' : 'Enviar examen'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
