import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCourseBySlugOrId, getAllCourses } from '@/lib/db/actions/courses';
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
      <div className="relative bg-black">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent z-10"></div>
          {course.thumbnail && (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover opacity-40"
            />
          )}
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {course.category && (
                  <p className="text-accent font-medium">{course.category}</p>
                )}
                <h1 className="text-3xl lg:text-5xl font-bold text-text-primary">{course.title}</h1>
                {course.description && (
                  <p className="text-lg text-text-secondary">{course.shortDescription || course.description.slice(0, 300)}</p>
                )}
                
                {course.instructor && (
                  <div className="flex items-center gap-4 mt-6">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-800">
                      {course.instructor.avatar ? (
                        <Image 
                          src={course.instructor.avatar} 
                          alt={course.instructor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          {course.instructor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary">{course.instructor.name}</h3>
                      {course.instructor.title && (
                        <p className="text-sm text-text-secondary">{course.instructor.title}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="rounded-lg bg-background-light p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-text-secondary">
                  {course.duration && (
                    <div>
                      <p className="font-medium text-text-primary">Duration</p>
                      <p>{course.duration}</p>
                    </div>
                  )}
                  {course.level && (
                    <div>
                      <p className="font-medium text-text-primary">Level</p>
                      <p>{course.level}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-text-primary">Lessons</p>
                    <p>{totalLessons} lessons</p>
                  </div>
                </div>
                
                <Link
                  href="#curriculum"
                  className="block w-full text-center py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
                >
                  View Curriculum
                </Link>
                
                {firstLesson && (
                  <Link
                    href={`/courses/${course.slug}/lessons/${firstLesson.id}`}
                    className="block w-full text-center py-3 border border-gray-700 text-text-primary rounded-md font-medium hover:bg-background transition-colors"
                  >
                    Start Learning
                  </Link>
                )}
              </div>
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
                <h2 className="text-2xl font-bold text-text-primary mb-6">About this Course</h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
              </section>
              
              {/* Curriculum */}
              <section id="curriculum">
                <h2 className="text-2xl font-bold text-text-primary mb-6">Course Curriculum</h2>
                <div className="space-y-4">
                  {course.modules.length > 0 ? (
                    course.modules.map((module, moduleIndex) => (
                      <div key={module.id} className="border border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-background-light p-4">
                          <h3 className="text-lg font-semibold text-text-primary">
                            Module {moduleIndex + 1}: {module.title}
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
                      <p>Course content is being prepared. Check back soon!</p>
                    </div>
                  )}
                </div>
              </section>
              
              {/* Instructor */}
              {course.instructor && (
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-6">Your Instructor</h2>
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
              <h3 className="text-xl font-semibold text-text-primary mb-4">What You&apos;ll Learn</h3>
              <ul className="space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-5 w-5 text-accent mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary">
                      {[
                        'Master core principles and frameworks',
                        'Build practical, real-world applications',
                        'Implement advanced techniques and methodologies',
                        'Develop problem-solving skills in the domain',
                        'Gain insights from industry case studies'
                      ][i]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            {relatedCourses.length > 0 && (
              <div className="bg-background-light rounded-lg p-6">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Related Courses</h3>
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
