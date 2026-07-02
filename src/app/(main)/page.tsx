import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses, CourseWithDetails } from '@/lib/db/actions/courses';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Testimonials } from '@/components/home/Testimonials';
import { Reveal } from '@/components/home/Reveal';
import { CourseGrid, GridCourse } from '@/components/home/CourseGrid';
import socialProof from '@/lib/data/social-proof.json';

export const revalidate = 300;

function countLessons(course: CourseWithDetails): number {
  if (typeof course.totalLessons === 'number') return course.totalLessons;
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

/** Left-aligned section header: bold sentence-case title with an optional
 * "Ver todos" link on the same row. */
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
      <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
        {title}
      </h2>
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
  const hasCourses = courses.length > 0;

  // Build course cards for the marketplace grid.
  const gridCourses: GridCourse[] = courses.map((course) => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    shortDescription: course.shortDescription ?? course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    lessonCount: countLessons(course),
    instructorName: course.instructor?.name ?? null,
  }));

  // Hero mosaic: first 4 course covers for the 2x2 grid.
  const heroThumbnails = courses
    .map((c) => c.thumbnail)
    .filter((t): t is string => Boolean(t))
    .slice(0, 4);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-6 tracking-tight leading-[1.05]">
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
                className="px-8 py-4 rounded-lg border border-gray-300 text-text-primary hover:border-accent hover:text-accent font-semibold text-lg transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Right: tidy 2x2 grid of course covers */}
          {heroThumbnails.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {heroThumbnails.map((thumb, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-background-light"
                >
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="20vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Course marketplace grid */}
      {hasCourses ? (
        <Reveal>
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title="Explora los cursos" href="/courses" />
              <CourseGrid courses={gridCourses} limit={12} />
            </div>
          </section>
        </Reveal>
      ) : (
        <Reveal>
          <section className="py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
              <div className="bg-surface border border-gray-200 rounded-xl shadow-sm p-8">
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
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-200">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.subscribers}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.subscribersLabel}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.videos}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.videosLabel}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-accent tracking-tight">
                {socialProof.stats.courses}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{socialProof.stats.coursesLabel}</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-accent tracking-tight">
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
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
                Lo que dice nuestra comunidad
              </h2>
            </div>
            <Testimonials testimonials={socialProof.testimonials} />
          </div>
        </section>
      </Reveal>

      {/* Mission strip */}
      <Reveal>
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 tracking-tight">
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
            <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-lg font-bold text-text-primary mb-2 tracking-tight">
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

      {/* Pre-footer CTA band */}
      <Reveal>
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight leading-[1.05] mb-6">
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
