import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses, CourseWithDetails } from '@/lib/db/actions/courses';
import { WaitlistForm } from '@/components/WaitlistForm';
import { Testimonials } from '@/components/home/Testimonials';
import { Reveal } from '@/components/home/Reveal';
import { CourseGrid, GridCourse } from '@/components/home/CourseGrid';
import { LogoMark } from '@/components/brand/Logo';
import { IconChevronRight, IconCheck } from '@/components/icons';
import socialProof from '@/lib/data/social-proof.json';

export const revalidate = 300;

function countLessons(course: CourseWithDetails): number {
  if (typeof course.totalLessons === 'number') return course.totalLessons;
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

/** Left-aligned section header: bold title, gray subtitle underneath, and
 * an optional bordered "Ver todos" pill button on the same row. */
function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel = 'Ver todos',
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-1.5 text-sm md:text-base text-text-secondary">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 flex-shrink-0 px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold text-text-primary hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
        >
          {linkLabel}
          <IconChevronRight size={16} />
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

  // Bento card B mosaic: 4 more course covers (falls back to the hero set
  // when there aren't enough courses to give each mosaic its own images).
  const bentoThumbnails = courses
    .map((c) => c.thumbnail)
    .filter((t): t is string => Boolean(t))
    .slice(4, 8);
  const bentoMosaic = bentoThumbnails.length === 4 ? bentoThumbnails : heroThumbnails;

  return (
    <div className="bg-background">
      {/* Hero: full-bleed dark band */}
      <section className="bg-[#17181c] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20 md:py-28 min-h-[520px]">
          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.05]">
              Aprende de los mejores, en español.
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0 mb-10">
              Cursos de desarrollo personal, negocios, ventas e inteligencia
              artificial dictados por los referentes de Latinoamérica. Gratis.
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
                className="px-8 py-4 rounded-lg border border-white/20 text-white hover:border-white/50 font-semibold text-lg transition-colors"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Right: offset course-cover mosaic */}
          {heroThumbnails.length > 0 && (
            <div className="hidden lg:grid grid-cols-2 gap-4 items-start">
              {[0, 1].map((col) => (
                <div key={col} className={`grid gap-4 ${col === 1 ? 'translate-y-8' : ''}`}>
                  {heroThumbnails.filter((_, i) => i % 2 === col).map((thumb, i) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10 bg-white/5"
                    >
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="22vw"
                        priority={col === 0 && i === 0}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stat counter band: directly under the dark hero */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <p className="flex items-center justify-center gap-2 text-5xl sm:text-6xl md:text-7xl font-bold text-text-primary tracking-tight">
            2.000.000+
            <span className="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full bg-accent" aria-hidden="true" />
          </p>
          <p className="mt-4 text-base md:text-lg text-text-secondary">
            personas aprenden con BiiA LAB en YouTube
          </p>
        </div>
      </section>

      {/* Course marketplace grid */}
      {hasCourses ? (
        <Reveal>
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                title="Explora los cursos"
                subtitle="Contenido curado y verificado por el equipo de BiiA LAB."
                href="/courses"
              />
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

      {/* Bento feature cards */}
      <Reveal>
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: certificate */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight mb-2">
                Certifícate y compártelo en LinkedIn
              </h3>
              <p className="text-text-secondary text-sm md:text-base mb-6 max-w-sm">
                Aprueba el examen de cada curso y obtén un certificado digital
                verificable, listo para agregar a tu perfil profesional.
              </p>
              <div className="mt-auto">
                <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6 max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <LogoMark size={28} />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Certificado de finalización</p>
                      <p className="text-[11px] text-text-secondary">BiiA LAB</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 rounded-full bg-background-light w-full" />
                    <div className="h-2.5 rounded-full bg-background-light w-4/5" />
                    <div className="h-2.5 rounded-full bg-background-light w-2/3" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-text-secondary">Verificado</span>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent text-white">
                      <IconCheck size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Spanish-language courses from top instructors */}
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-gray-200 p-8 flex flex-col">
              <h3 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight mb-2">
                Aprende de los mejores, en español
              </h3>
              <p className="text-text-secondary text-sm md:text-base mb-6 max-w-sm">
                Cursos gratuitos dictados por expertos de Latinoamérica, con
                certificado al aprobar el examen de cada curso.
              </p>
              {bentoMosaic.length > 0 && (
                <div className="mt-auto grid grid-cols-2 gap-3 max-w-sm">
                  {bentoMosaic.map((thumb, i) => (
                    <div
                      key={i}
                      className="relative aspect-video overflow-hidden rounded-lg border border-gray-200 bg-background-light"
                    >
                      <Image src={thumb} alt="" fill className="object-cover" sizes="200px" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </Reveal>

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
