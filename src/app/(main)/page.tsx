import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses, CourseWithDetails } from '@/lib/db/actions/courses';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Testimonials } from '@/components/home/Testimonials';
import { Reveal } from '@/components/home/Reveal';
import socialProof from '@/lib/data/social-proof.json';
import topCourses from '@/lib/data/top-courses.json';

export const revalidate = 300;

interface InstructorCard {
  name: string;
  title: string | null;
  avatar: string | null;
  category: string;
  thumbnail: string | null;
  courseCount: number;
  lessonCount: number;
}

function countLessons(course: CourseWithDetails): number {
  if (typeof course.totalLessons === 'number') return course.totalLessons;
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

/** Editorial left-aligned section header: accent tick + uppercase title,
 * with an optional "Ver todos" link on the same row. Change #1. */
function SectionHeader({
  title,
  href,
  linkLabel = 'Ver todos',
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <span className="block w-10 h-1 bg-accent mb-3" />
        <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="text-accent hover:underline text-sm font-medium whitespace-nowrap mb-1"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
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
  // Ghost typo backdrops (change #4) land behind the first 2-3 category rows.
  const ghostRowIndices = new Set(
    categoryRows.slice(0, 3).map((_, i) => i)
  );

  // Derive unique instructors (dedupe by name, aggregate course/lesson counts)
  const instructorMap = new Map<string, InstructorCard>();
  for (const course of courses) {
    if (!course.instructor) continue;
    const name = course.instructor.name;
    const lessonCount = countLessons(course);
    const existing = instructorMap.get(name);
    if (existing) {
      existing.courseCount += 1;
      existing.lessonCount += lessonCount;
      continue;
    }
    instructorMap.set(name, {
      name,
      title: course.instructor.title,
      avatar: course.instructor.avatar,
      category: course.category ?? 'Tecnología',
      thumbnail: course.thumbnail,
      courseCount: 1,
      lessonCount,
    });
  }
  const instructors = Array.from(instructorMap.values()).sort(
    (a, b) => b.courseCount - a.courseCount
  );
  const [featuredInstructor, ...otherInstructors] = instructors;

  const hasCourses = courses.length > 0;

  // Build a 3-column thumbnail mosaic from real course thumbnails for the hero.
  const mosaicThumbnails = courses
    .map((c) => c.thumbnail)
    .filter((t): t is string => Boolean(t))
    .slice(0, 9);
  const mosaicColumns: string[][] = [[], [], []];
  mosaicThumbnails.forEach((thumb, i) => {
    mosaicColumns[i % 3].push(thumb);
  });

  // Spotlight band (change #2): first featured course that has a thumbnail.
  const spotlightCourse = courses.find((c) => c.isFeatured && c.thumbnail);

  // Top 10 row (change #3): ranked slugs from a static ranking file, mapped
  // against the live course list. Courses not found are skipped.
  const courseBySlug = new Map(courses.map((c) => [c.slug, c]));
  const rankedCourses = topCourses.slugs
    .map((slug) => courseBySlug.get(slug))
    .filter((c): c is CourseWithDetails => Boolean(c));

  // Pre-footer CTA collage (change #7): up to 4 course thumbnails.
  const collageThumbnails = mosaicThumbnails.slice(0, 4);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <h1 className="font-display uppercase text-4xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-6 tracking-tight leading-[0.95]">
              Aprende de los mejores, en español.
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-xl mx-auto lg:mx-0 mb-10">
              Cursos de inteligencia artificial, machine learning y tecnología de
              vanguardia dictados por expertos de Latinoamérica. Gratis para
              empezar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/courses"
                className="px-8 py-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-lg transition-colors"
              >
                Explorar cursos
              </Link>
              <Link
                href="/sign-up"
                className="px-8 py-4 rounded-lg border border-gray-700 text-text-primary hover:border-accent hover:text-accent font-semibold text-lg transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Right: thumbnail mosaic */}
          {mosaicThumbnails.length > 0 && (
            <div className="relative h-[420px] sm:h-[520px] lg:h-[560px] overflow-hidden">
              <div className="grid grid-cols-3 gap-3 h-full">
                {mosaicColumns.map((col, colIndex) => (
                  <div
                    key={colIndex}
                    className={`flex flex-col gap-3 ${
                      colIndex === 1 ? 'hero-mosaic-col-down mt-10' : 'hero-mosaic-col-up'
                    }`}
                  >
                    {col.map((thumb, i) => (
                      <div
                        key={i}
                        className="relative w-full aspect-[3/4] overflow-hidden rounded-xl bg-surface flex-shrink-0"
                      >
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 33vw, 16vw"
                          priority={colIndex === 0 && i === 0}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {/* Gradient masks top/bottom */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}
        </div>
      </section>

      {/* Spotlight band (change #2) */}
      {spotlightCourse && spotlightCourse.thumbnail && (
        <Reveal>
          <section className="relative w-full min-h-[70vh] flex items-center overflow-hidden">
            <div className="absolute inset-0">
              <Image
                src={spotlightCourse.thumbnail}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            </div>
            <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                Curso destacado
              </p>
              <h2 className="font-display uppercase text-5xl md:text-7xl font-bold text-text-primary tracking-tight leading-[0.95] max-w-3xl mb-6">
                {spotlightCourse.title}
              </h2>
              <p className="text-text-secondary text-base md:text-lg mb-2 max-w-xl">
                {spotlightCourse.shortDescription ?? spotlightCourse.description}
              </p>
              <p className="text-text-secondary text-sm mb-8">
                {spotlightCourse.instructor?.name}
                {spotlightCourse.instructor && ' · '}
                {countLessons(spotlightCourse)} lecciones
              </p>
              <Link
                href={`/courses/${spotlightCourse.slug}`}
                className="inline-flex items-center px-8 py-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-lg transition-colors"
              >
                Ver el curso
              </Link>
            </div>
          </section>
        </Reveal>
      )}

      {/* Top 10 row (change #3) */}
      {rankedCourses.length > 0 && (
        <Reveal>
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title="Los 10 más vistos" />
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                {rankedCourses.map((course, i) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group flex-shrink-0 flex items-center snap-start"
                  >
                    <span
                      className="text-outline font-display text-[10rem] leading-none font-bold select-none z-0 relative"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <div className="relative w-64 aspect-video overflow-hidden rounded-md bg-surface -ml-10 z-10 shadow-2xl">
                      {course.thumbnail && (
                        <Image
                          src={course.thumbnail}
                          alt={course.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="256px"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3">
                        <p className="font-semibold text-white text-sm drop-shadow line-clamp-1 flex items-center gap-1.5">
                          <span className="line-clamp-1">{course.title}</span>
                          <span
                            className="inline-block -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Category rows */}
      {hasCourses ? (
        <section className="py-16 space-y-16">
          {categoryRows.map(([category, categoryCourses], rowIndex) => (
            <Reveal key={category}>
              <div
                className={`px-4 sm:px-6 lg:px-8 relative ${
                  ghostRowIndices.has(rowIndex) ? 'overflow-hidden' : ''
                }`}
              >
                {/* Ghost typo backdrop (change #4) */}
                {ghostRowIndices.has(rowIndex) && (
                  <span
                    className="text-outline font-display uppercase absolute -top-10 left-0 right-0 text-[8rem] md:text-[12rem] leading-none opacity-[0.07] pointer-events-none select-none whitespace-nowrap overflow-hidden"
                    aria-hidden="true"
                  >
                    {category}
                  </span>
                )}
                <div className="max-w-7xl mx-auto relative">
                  <SectionHeader
                    title={category}
                    href={`/courses?category=${encodeURIComponent(category)}`}
                  />
                  <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hidden pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {categoryCourses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="group flex-shrink-0 w-72 snap-start"
                      >
                        <div className="relative aspect-video overflow-hidden rounded-md bg-surface">
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
                          <h3 className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-1 flex items-center gap-1.5">
                            <span className="line-clamp-1">{course.title}</span>
                            <span
                              className="inline-block -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 text-accent"
                              aria-hidden="true"
                            >
                              →
                            </span>
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
            </Reveal>
          ))}

          {categoryRows.length === 0 && (
            <Reveal>
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                  <SectionHeader title="Cursos" href="/courses" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {courses.slice(0, 6).map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.slug}`}
                        className="group flex flex-col overflow-hidden rounded-lg bg-surface border border-gray-700/50 hover:border-accent/50 transition-all"
                      >
                        <div className="relative aspect-video overflow-hidden bg-surface">
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
            </Reveal>
          )}
        </section>
      ) : (
        <Reveal>
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
              <div className="bg-surface border border-gray-700/50 rounded-xl p-8">
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
        </Reveal>
      )}

      {/* Stats strip */}
      <Reveal>
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-700/50">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.subscribers}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.subscribersLabel}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.videos}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.videosLabel}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.courses}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.coursesLabel}</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.lessons}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.lessonsLabel}</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Testimonials */}
      <Reveal>
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-start mb-10">
              <span className="block w-10 h-1 bg-accent mb-3" />
              <h2 className="font-display uppercase text-2xl md:text-3xl font-semibold text-text-primary tracking-tight">
                Lo que dice nuestra comunidad
              </h2>
            </div>
            <Testimonials testimonials={socialProof.testimonials} />
          </div>
        </section>
      </Reveal>

      {/* Instructores (change #5) */}
      {featuredInstructor && (
        <Reveal>
          <section className="py-16 overflow-hidden">
            <div className="px-4 sm:px-6 lg:px-8 mb-10">
              <div className="max-w-7xl mx-auto">
                <SectionHeader title="Instructores" href="/courses" linkLabel="Ver cursos" />
              </div>
            </div>

            {/* Asymmetric feature: portrait bleeding to the viewport edge */}
            <div className="relative flex flex-col md:flex-row items-stretch min-h-[420px] md:min-h-[520px]">
              <div className="relative w-full md:w-[45%] aspect-[4/3] md:aspect-auto min-h-[280px] bg-surface flex-shrink-0">
                {(featuredInstructor.avatar || featuredInstructor.thumbnail) && (
                  <Image
                    src={featuredInstructor.avatar || featuredInstructor.thumbnail || ''}
                    alt={featuredInstructor.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 45vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-background via-transparent to-transparent" />
              </div>
              <div className="relative flex-1 flex items-center px-4 sm:px-6 lg:px-8">
                <div className="relative max-w-xl md:-ml-16 py-10">
                  <span
                    className="text-outline font-display uppercase absolute -top-10 -left-4 text-[6rem] md:text-[9rem] leading-none opacity-[0.08] pointer-events-none select-none whitespace-nowrap"
                    aria-hidden="true"
                  >
                    {featuredInstructor.name}
                  </span>
                  <p className="relative text-accent text-sm font-semibold tracking-widest uppercase mb-4">
                    Instructor destacado
                  </p>
                  <h3 className="relative font-display uppercase text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[0.95] mb-4">
                    {featuredInstructor.name}
                  </h3>
                  <p className="relative text-text-secondary mb-8">
                    {featuredInstructor.courseCount}{' '}
                    {featuredInstructor.courseCount === 1 ? 'curso' : 'cursos'} ·{' '}
                    {featuredInstructor.lessonCount}{' '}
                    {featuredInstructor.lessonCount === 1 ? 'lección' : 'lecciones'}
                  </p>
                  <Link
                    href={`/courses?category=${encodeURIComponent(featuredInstructor.category)}`}
                    className="relative inline-flex items-center px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors"
                  >
                    Ver cursos
                  </Link>
                </div>
              </div>
            </div>

            {/* Remaining instructors: compact horizontal scroll row */}
            {otherInstructors.length > 0 && (
              <div className="px-4 sm:px-6 lg:px-8 mt-12">
                <div className="max-w-7xl mx-auto">
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hidden pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                    {otherInstructors.map((instructor) => (
                      <Link
                        key={instructor.name}
                        href={`/courses?category=${encodeURIComponent(instructor.category)}`}
                        className="group relative flex-shrink-0 w-40 aspect-[3/4] h-56 overflow-hidden rounded-md bg-surface snap-start"
                      >
                        {(instructor.avatar || instructor.thumbnail) && (
                          <Image
                            src={instructor.avatar || instructor.thumbnail || ''}
                            alt={instructor.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="160px"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                          <p className="text-[11px] text-text-secondary mb-1 line-clamp-1">
                            Enseña {instructor.category}
                          </p>
                          <p className="font-display uppercase text-sm font-semibold text-white tracking-tight line-clamp-1">
                            {instructor.name}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </Reveal>
      )}

      {/* Mission strip */}
      <Reveal>
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-700/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="block w-10 h-1 bg-accent mb-3" />
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
            <div className="bg-surface rounded-xl border border-gray-700/50 p-8">
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
      </Reveal>

      {/* Pre-footer CTA band (change #7) */}
      <Reveal>
        <section className="relative w-full py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-background-light">
          {collageThumbnails.length > 0 && (
            <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-4 opacity-30">
              {collageThumbnails.map((thumb, i) => (
                <div key={i} className="relative">
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60" />
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="font-display uppercase text-5xl md:text-7xl font-bold text-text-primary tracking-tight leading-[0.95] mb-6">
              Empieza gratis hoy.
            </h2>
            <p className="text-text-secondary text-lg mb-10">
              Únete a la comunidad de BiiALab y accede a cursos de IA y tecnología
              en español, sin costo para empezar.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center px-8 py-4 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-lg transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
