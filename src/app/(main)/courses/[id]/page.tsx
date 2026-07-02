import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCourseBySlugOrId, getAllCourses } from '@/lib/db/actions/courses';
import { getCourseExam } from '@/lib/db/actions/exams';
import { courses as staticCourses } from '@/lib/data';
import { YouTubeEmbed } from '@/components/video/YouTubeEmbed';

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  
  // Try to get from database first
  let course = await getCourseBySlugOrId(id);
  const examRes = await getCourseExam(id).catch(() => ({ exam: null }));
  const hasExam = !!examRes.exam;
  
  // Fallback to static data if not in database
  if (!course) {
    const staticCourse = staticCourses.find(c => c.id === id);
    if (staticCourse) {
      course = {
        id: staticCourse.id,
        slug: staticCourse.id,
        title: staticCourse.title,
        description: staticCourse.description,
        shortDescription: staticCourse.description?.slice(0, 200) || null,
        thumbnail: staticCourse.thumbnail,
        category: staticCourse.category,
        level: staticCourse.level,
        duration: staticCourse.duration,
        totalLessons: staticCourse.lessons,
        status: 'published',
        isFeatured: staticCourse.isFeatured || false,
        instructor: staticCourse.instructor ? {
          id: staticCourse.instructor.id,
          name: staticCourse.instructor.name,
          title: staticCourse.instructor.title,
          bio: staticCourse.instructor.bio,
          avatar: staticCourse.instructor.avatar,
        } : null,
        modules: staticCourse.modules?.map(m => ({
          id: m.id,
          title: m.title,
          sortOrder: 0,
          lessons: m.lessons.map((l, idx) => ({
            id: l.id,
            title: l.title,
            description: l.description || null,
            videoUrl: l.videoUrl || null,
            duration: l.duration || null,
            youtubeVideoId: null,
            sortOrder: idx,
            isFree: !l.isLocked,
            isLocked: l.isLocked || false,
          })),
        })) || [],
      };
    }
  }
  
  if (!course) {
    notFound();
  }

  // Get related courses from database
  const allDbCourses = await getAllCourses();
  const relatedCourses = allDbCourses
    .filter(c => c.category === course!.category && c.id !== course!.id)
    .slice(0, 2);

  // Calculate total lessons
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0) || course.totalLessons || 0;

  // Get first lesson for "Start Learning" button
  const firstLesson = course.modules[0]?.lessons[0];
  
  return (
    <div className="bg-background min-h-screen">
      {/* Course Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: full-bleed thumbnail */}
        <div className="relative aspect-video lg:aspect-auto lg:min-h-[420px] bg-black overflow-hidden">
          {course.thumbnail && (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover"
              priority
            />
          )}
        </div>

        {/* Right: title, meta, CTAs */}
        <div className="flex flex-col justify-center bg-background-light px-6 sm:px-10 lg:px-16 py-12 lg:py-16">
          <div className="space-y-5 max-w-xl">
            {course.category && (
              <p className="text-accent font-semibold text-sm uppercase tracking-wide">{course.category}</p>
            )}
            <h1 className="font-display uppercase text-4xl md:text-6xl font-bold text-text-primary leading-[0.95] tracking-tight">
              {course.title}
            </h1>

            {course.instructor && (
              <p className="text-text-secondary">
                Con <span className="text-text-primary font-medium">{course.instructor.name}</span>
              </p>
            )}

            {course.description && (
              <p className="text-lg text-text-secondary">
                {course.shortDescription || course.description.slice(0, 300)}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              {firstLesson && (
                <Link
                  href={`/courses/${course.slug}/lessons/${firstLesson.id}`}
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-accent text-white rounded-md font-semibold hover:bg-accent/90 transition-colors"
                >
                  Comenzar curso
                </Link>
              )}
              {hasExam && (
                <Link
                  href={`/courses/${'slug' in course ? course.slug : id}/examen`}
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-gray-700 text-text-primary rounded-md font-semibold hover:border-accent hover:text-accent transition-colors"
                >
                  Presentar examen
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta strip */}
      <div className="border-y border-gray-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Duración</p>
              <p className="text-accent font-medium mt-1">{course.duration || 'A tu ritmo'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Nivel</p>
              <p className="text-accent font-medium mt-1">{course.level || 'Todos los niveles'}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Lecciones</p>
              <p className="text-accent font-medium mt-1">{totalLessons}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide">Categoría</p>
              <p className="text-accent font-medium mt-1">{course.category || 'General'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <div className="space-y-12">
              {/* About */}
              <section>
                <h2 className="font-display uppercase text-2xl font-semibold text-text-primary mb-6 tracking-tight">Sobre este curso</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </section>
              
              {/* Final exam */}
              {hasExam && (
                <section>
                  <div className="bg-background-light border border-accent/30 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-text-primary">Examen final</h2>
                      <p className="text-text-secondary text-sm mt-1">
                        Demuestra lo aprendido y obtén tu certificado al aprobar.
                      </p>
                    </div>
                    <Link
                      href={`/courses/${'slug' in course ? course.slug : id}/examen`}
                      className="px-6 py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors text-center"
                    >
                      Presentar examen
                    </Link>
                  </div>
                </section>
              )}

              {/* Curriculum */}
              <section id="curriculum">
                <h2 className="font-display uppercase text-2xl font-semibold text-text-primary mb-6 tracking-tight">Contenido del curso</h2>
                <div className="space-y-4">
                  {course.modules.length > 0 ? (
                    course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="border border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-background-light p-4">
                          <h3 className="text-lg font-semibold text-text-primary">
                            Módulo {moduleIndex + 1}: {module.title}
                          </h3>
                        </div>
                        <div className="divide-y divide-gray-800">
                          {module.lessons.map((lesson) => (
                            <div key={lesson.id} className="p-4 flex justify-between items-center">
                              <div className="flex-1">
                                <h4 className="font-medium text-text-primary">{lesson.title}</h4>
                                {lesson.duration && (
                                  <p className="text-sm text-text-secondary">{lesson.duration}</p>
                                )}
                              </div>
                              <Link 
                                href={`/courses/${course.slug}/lessons/${lesson.id}`}
                                className="text-accent hover:text-accent/80 transition-colors ml-4"
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-text-secondary">
                      <p>Estamos preparando el contenido del curso. ¡Vuelve pronto!</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Instructor */}
              {course.instructor && (
                <section>
                  <h2 className="font-display uppercase text-2xl font-semibold text-text-primary mb-6 tracking-tight">Tu instructor</h2>
                  <div className="bg-background-light rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-800">
                        {course.instructor.avatar ? (
                          <Image 
                            src={course.instructor.avatar} 
                            alt={course.instructor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl text-text-secondary">
                            {course.instructor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">{course.instructor.name}</h3>
                        {course.instructor.title && (
                          <p className="text-text-secondary mb-4">{course.instructor.title}</p>
                        )}
                        {course.instructor.bio && (
                          <p className="text-text-secondary">{course.instructor.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-background-light rounded-lg p-6">
              <h3 className="font-display uppercase text-xl font-semibold text-text-primary mb-4 tracking-tight">Qué vas a aprender</h3>
              <ul className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-5 w-5 text-accent mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary">
                      {[
                        'Domina los principios y marcos fundamentales',
                        'Construye aplicaciones prácticas del mundo real',
                        'Implementa técnicas y metodologías avanzadas',
                        'Desarrolla habilidades de resolución de problemas en el área',
                        'Aprende de casos de estudio de la industria'
                      ][i]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {relatedCourses.length > 0 && (
              <div className="bg-background-light rounded-lg p-6">
                <h3 className="font-display uppercase text-xl font-semibold text-text-primary mb-4 tracking-tight">Cursos relacionados</h3>
                <div className="space-y-4">
                  {relatedCourses.map(relatedCourse => (
                    <Link 
                      href={`/courses/${relatedCourse.slug}`} 
                      key={relatedCourse.id}
                      className="block group"
                    >
                      <div className="flex gap-4">
                        {relatedCourse.thumbnail && (
                          <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded">
                            <Image 
                              src={relatedCourse.thumbnail} 
                              alt={relatedCourse.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-text-primary group-hover:text-accent transition-colors">
                            {relatedCourse.title}
                          </h4>
                          {relatedCourse.instructor && (
                            <p className="text-xs text-text-secondary mt-1">
                              {relatedCourse.instructor.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
