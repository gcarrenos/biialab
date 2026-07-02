import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses, CourseWithDetails } from '@/lib/db/actions/courses';
import { WaitlistForm } from '@/components/WaitlistForm';
import { HeroMedia } from '@/components/home/HeroMedia';

export const revalidate = 300;

interface InstructorCard {
  name: string;
  title: string | null;
  avatar: string | null;
  category: string;
  thumbnail: string | null;
}

export default async function HomePage() {
  const courses = await getAllCourses();

  // Group courses by category (only categories with >= 3 courses become a row)
  const byCategory = new Map<string, CourseWithDetails[]>();
  for (const course of courses) {
    const category = course.category ?? 'Otros cursos';
    const list = byCategory.get(category) ?? [];
    list.push(course);
    byCategory.set(category, list);
  }
  const categoryRows = Array.from(byCategory.entries()).filter(
    ([, list]) => list.length >= 3
  );

  // Derive unique instructors (dedupe by name, take first course's thumbnail + category)
  const instructorMap = new Map<string, InstructorCard>();
  for (const course of courses) {
    if (!course.instructor) continue;
    const name = course.instructor.name;
    if (instructorMap.has(name)) continue;
    instructorMap.set(name, {
      name,
      title: course.instructor.title,
      avatar: course.instructor.avatar,
      category: course.category ?? 'Tecnología',
      thumbnail: course.thumbnail,
    });
  }
  const instructors = Array.from(instructorMap.values());

  const hasCourses = courses.length > 0;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <HeroMedia />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="font-display uppercase text-5xl md:text-7xl font-bold text-text-primary mb-6 tracking-tight leading-[0.95]">
            Aprende de los mejores,{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              en español
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Cursos de inteligencia artificial, machine learning y tecnología de
            vanguardia dictados por expertos de Latinoamérica. Gratis para
            empezar.
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

      {/* Category rows */}
      {hasCourses ? (
        <section className="py-16 space-y-16">
          {categoryRows.map(([category, categoryCourses]) => (
            <div key={category} className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-6">
                  <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
                    {category}
                  </h2>
                  <Link
                    href={`/courses?category=${encodeURIComponent(category)}`}
                    className="text-accent hover:underline text-sm font-medium whitespace-nowrap"
                  >
                    Ver todos →
                  </Link>
                </div>
                <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hidden pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                  {categoryCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group flex-shrink-0 w-72 snap-start"
                    >
                      <div className="relative aspect-video overflow-hidden rounded-md bg-gray-900">
                        {course.thumbnail && (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="288px"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        {course.instructor && (
                          <p className="absolute bottom-2 left-3 font-bold text-white text-sm drop-shadow">
                            {course.instructor.name}
                          </p>
                        )}
                      </div>
                      <div className="mt-3">
                        <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                          {course.shortDescription ?? course.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {categoryRows.length === 0 && (
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-6">
                  <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
                    Cursos
                  </h2>
                  <Link href="/courses" className="text-accent hover:underline text-sm font-medium">
                    Ver todos →
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.slice(0, 6).map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group flex flex-col overflow-hidden rounded-lg bg-background-light border border-gray-800 hover:border-accent/50 transition-all"
                    >
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        {course.thumbnail && (
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        {course.instructor && (
                          <p className="absolute bottom-2 left-3 font-bold text-white text-sm drop-shadow">
                            {course.instructor.name}
                          </p>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                          {course.shortDescription ?? course.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto">
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
        </section>
      )}

      {/* Instructores */}
      {instructors.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary tracking-tight mb-10">
              Instructores
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {instructors.map((instructor) => (
                <Link
                  key={instructor.name}
                  href={`/courses?category=${encodeURIComponent(instructor.category)}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-md bg-gray-900"
                >
                  {(instructor.avatar || instructor.thumbnail) && (
                    <Image
                      src={instructor.avatar || instructor.thumbnail || ''}
                      alt={instructor.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                    <p className="text-xs text-text-secondary mb-1">
                      Enseña {instructor.category}
                    </p>
                    <p className="font-display uppercase text-lg font-semibold text-white tracking-tight">
                      {instructor.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mission strip */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary mb-4 tracking-tight">
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
            <h3 className="font-display uppercase text-lg font-semibold text-text-primary mb-2 tracking-tight">
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
