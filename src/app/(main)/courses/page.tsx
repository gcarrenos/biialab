'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAllCourses, CourseWithDetails } from '@/lib/db/actions/courses';

// Unified course type for display
interface DisplayCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  duration: string;
  lessons: number;
  isFeatured: boolean;
  instructor: {
    name: string;
    title: string;
    avatar: string;
  };
}

// Course card component that works with both types
function CourseCard({ course }: { course: DisplayCourse }) {
  const initial = course.instructor.name.charAt(0).toUpperCase();
  const hue = course.instructor.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-surface border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <Link href={`/courses/${course.slug}`} className="absolute inset-0 z-10" aria-label={course.title}></Link>

      <div className="relative overflow-hidden aspect-video bg-background-light">
        <Image
          src={course.thumbnail || "https://picsum.photos/800/450?random=placeholder"}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        {course.isFeatured && (
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 text-xs font-semibold rounded z-20">
            Destacado
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow p-4">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
            aria-hidden="true"
          >
            {initial}
          </div>
          <h3 className="flex-1 min-w-0 text-sm font-bold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
            {course.title}
          </h3>
        </div>

        <p className="text-sm text-text-secondary line-clamp-1 mb-3">
          {course.description}
        </p>

        <div className="mt-auto flex items-center justify-between text-xs text-text-secondary">
          <span>{course.lessons} lecciones · {course.level || 'Todos los niveles'}</span>
          <span className="font-bold text-accent">Gratis</span>
        </div>
      </div>
    </div>
  );
}

function CourseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(queryParam ?? '');
  const [allCourses, setAllCourses] = useState<DisplayCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<DisplayCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const levels = ['Principiante', 'Intermedio', 'Avanzado'];
  
  // Convert database course to display format
  const dbToDisplay = (course: CourseWithDetails): DisplayCourse => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description || course.shortDescription || '',
    thumbnail: course.thumbnail || 'https://picsum.photos/800/450?random=' + course.id,
    category: course.category || 'General',
    level: course.level || 'Todos los niveles',
    duration: course.duration || 'A tu ritmo',
    lessons: course.modules.reduce((sum, m) => sum + m.lessons.length, 0) || course.totalLessons || 0,
    isFeatured: course.isFeatured || false,
    instructor: course.instructor ? {
      name: course.instructor.name,
      title: course.instructor.title || '',
      avatar: course.instructor.avatar || '',
    } : {
      name: 'BiiALab',
      title: 'Instructor',
      avatar: '',
    },
  });
  
  // Fetch courses from database (published catalog is DB-only; no sample-data fallback)
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const dbCourses = await getAllCourses();
        const dbDisplayCourses = dbCourses.map(dbToDisplay);
        setAllCourses(dbDisplayCourses);
        setFilteredCourses(dbDisplayCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setAllCourses([]);
        setFilteredCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);
  
  // Get unique categories from all courses
  const categories = [...new Set(allCourses.map(course => course.category).filter(Boolean))];
  
  // Apply filters
  useEffect(() => {
    let result = allCourses;

    if (selectedCategory) {
      result = result.filter(course => course.category === selectedCategory);
    }

    if (selectedLevel) {
      result = result.filter(course => course.level === selectedLevel);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(course =>
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q)
      );
    }

    setFilteredCourses(result);
  }, [selectedCategory, selectedLevel, searchTerm, allCourses]);
  
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };
  
  const handleLevelChange = (level: string | null) => {
    setSelectedLevel(level === selectedLevel ? null : level);
  };
  
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedLevel(null);
  };

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-accent border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Cargando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="border-b border-gray-200 pb-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">Cursos</h1>
          <p className="mt-2 text-lg text-text-secondary">
            Explora nuestros cursos y encuentra el ideal para ti.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {allCourses.length} curso{allCourses.length !== 1 ? 's' : ''} disponible{allCourses.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4 tracking-tight">Categorías</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`block w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedCategory === category
                        ? 'border-accent bg-accent/5 text-accent font-medium'
                        : 'border-transparent text-text-secondary hover:bg-background-light'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4 tracking-tight">Nivel</h3>
              <div className="space-y-2">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
                    className={`block w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedLevel === level
                        ? 'border-accent bg-accent/5 text-accent font-medium'
                        : 'border-transparent text-text-secondary hover:bg-background-light'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {(selectedCategory || selectedLevel) && (
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-background-light border border-gray-200 text-text-primary text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          {/* Course grid */}
          <div className="lg:col-span-3">
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-text-primary">
                  {allCourses.length === 0 ? 'Muy pronto publicaremos los primeros cursos' : 'No hay cursos con esos filtros'}
                </h3>
                <p className="mt-2 text-text-secondary">
                  {allCourses.length === 0 ? 'Déjanos tu correo en la página de inicio y te avisamos.' : 'Prueba ajustando los filtros.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-accent border-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Cargando cursos...</p>
        </div>
      </div>
    }>
      <CourseContent />
    </Suspense>
  );
}
