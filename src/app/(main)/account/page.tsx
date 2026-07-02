'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getMyLearning, LearningEntry } from '@/lib/db/actions/progress';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    getMyLearning()
      .then((res) => setEntries(res.entries))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <div className="relative h-16 w-16 rounded-full bg-accent/20 overflow-hidden flex items-center justify-center text-2xl font-bold text-accent">
            {user?.image ? (
              <Image src={user.image} alt={user.name ?? ''} fill className="object-cover" />
            ) : (
              (user?.name ?? '?').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-text-primary">{user?.name}</h1>
            <p className="text-text-secondary text-sm">{user?.email}</p>
          </div>
        </div>

        {/* My courses */}
        <h2 className="text-xl font-semibold text-text-primary mb-6">Mis cursos</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-background-light border border-gray-800 rounded-xl p-10 text-center">
            <h3 className="text-lg font-medium text-text-primary mb-2">Aún no estás inscrito en ningún curso</h3>
            <p className="text-text-secondary mb-6">
              Abre cualquier lección y quedarás inscrito automáticamente. Tu progreso se guarda aquí.
            </p>
            <Link
              href="/courses"
              className="inline-flex px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {entries.map((entry) => {
              const pct = entry.totalLessons > 0
                ? Math.round((entry.completedLessons / entry.totalLessons) * 100)
                : 0;
              return (
                <Link
                  key={entry.courseId}
                  href={`/courses/${entry.slug}`}
                  className="group flex gap-4 bg-background-light border border-gray-800 hover:border-accent/50 rounded-xl p-4 transition-all"
                >
                  <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-900">
                    {entry.thumbnail && (
                      <Image src={entry.thumbnail} alt={entry.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="flex flex-col flex-grow min-w-0">
                    <p className="text-xs text-accent">{entry.category ?? 'Curso'}</p>
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {entry.title}
                    </h3>
                    <div className="mt-auto pt-2">
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                        <span>{entry.completedLessons}/{entry.totalLessons} lecciones</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Certificates */}
        <h2 className="text-xl font-semibold text-text-primary mt-14 mb-6">Mis certificados</h2>
        <div className="bg-background-light border border-gray-800 rounded-xl p-8 text-center text-text-secondary">
          Aún no tienes certificados. Completa un curso y aprueba su examen final para obtener el tuyo.
        </div>
      </div>
    </div>
  );
}
