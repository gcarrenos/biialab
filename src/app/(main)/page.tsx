import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses } from '@/lib/db/actions/courses';
import { WaitlistForm } from '@/components/WaitlistForm';
import { HeroMedia } from '@/components/home/HeroMedia';

export const revalidate = 300;

export default async function HomePage() {
  const courses = await getAllCourses();
  const featured = courses.filter((c) => c.isFeatured);
  const showcased = (featured.length > 0 ? featured : courses).slice(0, 6);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <HeroMedia />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 tracking-tight">
            Aprende IA y tecnología,{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              en español
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Cursos de inteligencia artificial, machine learning y tecnología de
            vanguardia para Latinoamérica. Gratis para empezar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/courses"
              className="px-8 py-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-lg transition-colors"
            >
              Explorar cursos
            </Link>
            <Link
              href="/social-impact"
              className="px-8 py-4 rounded-lg border border-gray-700 text-text-primary hover:border-accent hover:text-accent font-semibold text-lg transition-colors"
            >
              Nuestra misión
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                {showcased.length > 0 ? 'Cursos destacados' : 'Cursos'}
              </h2>
              <p className="text-text-secondary mt-2">
                {showcased.length > 0
                  ? 'Empieza por aquí.'
                  : 'Estamos preparando los primeros cursos.'}
              </p>
            </div>
            {showcased.length > 0 && (
              <Link href="/courses" className="text-accent hover:underline text-sm font-medium">
                Ver todos →
              </Link>
            )}
          </div>

          {showcased.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {showcased.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex flex-col overflow-hidden rounded-lg bg-background-light border border-gray-800 hover:border-accent/50 transition-all"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-900">
                    {course.thumbnail && (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-xs text-accent mb-1">{course.category ?? 'Tecnología'}</p>
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                      {course.shortDescription ?? course.description}
                    </p>
                    <p className="mt-auto pt-4 text-xs text-text-secondary">
                      {course.modules.reduce((sum, m) => sum + m.lessons.length, 0) || course.totalLessons || 0}{' '}
                      lecciones{course.duration ? ` · ${course.duration}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="max-w-xl">
              <div className="bg-background-light border border-gray-800 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  Sé el primero en enterarte
                </h3>
                <p className="text-text-secondary mb-6">
                  Los primeros cursos están en producción. Déjanos tu correo y te
                  avisamos cuando estén listos.
                </p>
                <WaitlistForm source="homepage" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mission strip */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Tecnología con propósito
            </h2>
            <p className="text-text-secondary mb-6">
              BiiALab es más que cursos: aplicamos IA a problemas reales de
              nuestra comunidad y documentamos cómo se construye. Conoce el caso
              de estudio de PlanVoyager, una herramienta gratuita de interés
              público construida con los principios que enseñamos.
            </p>
            <Link
              href="/casos/planvoyager"
              className="inline-flex items-center px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Leer el caso de estudio
            </Link>
          </div>
          <div className="bg-background rounded-xl border border-gray-800 p-8">
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Nuevos cursos, directo a tu correo
            </h3>
            <p className="text-text-secondary text-sm mb-5">
              Sin spam. Solo lanzamientos y contenido nuevo.
            </p>
            <WaitlistForm source="homepage" />
          </div>
        </div>
      </section>
    </div>
  );
}
