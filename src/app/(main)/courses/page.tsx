'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { courses as staticCourses } from '@/lib/data';
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
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-background-light shadow-lg transition-all hover:shadow-xl">
      <Link href={`/courses/${course.slug}`} className="absolute inset-0 z-10" aria-label={course.title}></Link>
      
      <div className="relative overflow-hidden h-48">
        <Image 
          src={course.thumbnail || "https://picsum.photos/800/450?random=placeholder"} 
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        {course.isFeatured && (
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 text-xs font-semibold rounded z-20">
            Featured
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow p-5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-xs text-text-secondary mb-1">{course.category}</p>
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
              {course.title}
            </h3>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-text-secondary line-clamp-2">
          {course.description}
        </p>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-700">
            {course.instructor.avatar ? (
              <Image 
                src={course.instructor.avatar} 
                alt={course.instructor.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
                {course.instructor.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-primary">{course.instructor.name}</span>
            <span className="text-xs text-text-secondary">{course.instructor.title}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 text-xs text-text-secondary">
          <div className="flex flex-col">
            <span className="font-medium">Duration</span>
            <span>{course.duration || 'Self-paced'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Level</span>
            <span>{course.level || 'All levels'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Lessons</span>
            <span>{course.lessons}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<DisplayCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<DisplayCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  
  // Convert database course to display format
  const dbToDisplay = (course: CourseWithDetails): DisplayCourse => ({
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description || course.shortDescription || '',
    thumbnail: course.thumbnail || 'https://picsum.photos/800/450?random=' + course.id,
    category: course.category || 'General',
    level: course.level || 'All levels',
    duration: course.duration || 'Self-paced',
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
  
  // Convert static course to display format
  const staticToDisplay = (course: typeof staticCourses[0]): DisplayCourse => ({
    id: course.id,
    slug: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    duration: course.duration,
    lessons: course.lessons,
    isFeatured: course.isFeatured || false,
    instructor: {
      name: course.instructor.name,
      title: course.instructor.title,
      avatar: course.instructor.avatar,
    },
  });
  
  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        // Fetch from database
        const dbCourses = await getAllCourses();
        const dbDisplayCourses = dbCourses.map(dbToDisplay);
        
        // Convert static courses
        const staticDisplayCourses = staticCourses.map(staticToDisplay);
        
        // Merge - database courses first, then static (avoiding duplicates by title)
        const dbTitles = new Set(dbDisplayCourses.map(c => c.title.toLowerCase()));
        const uniqueStaticCourses = staticDisplayCourses.filter(
          c => !dbTitles.has(c.title.toLowerCase())
        );
        
        const merged = [...dbDisplayCourses, ...uniqueStaticCourses];
        setAllCourses(merged);
        setFilteredCourses(merged);
      } catch (error) {
        console.error('Error fetching courses:', error);
        // Fallback to static courses
        const staticDisplayCourses = staticCourses.map(staticToDisplay);
        setAllCourses(staticDisplayCourses);
        setFilteredCourses(staticDisplayCourses);
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
    
    setFilteredCourses(result);
  }, [selectedCategory, selectedLevel, allCourses]);
  
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
          <div className="w-16 h-16 border-4 border-t-accent border-gray-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="border-b border-gray-800 pb-8 mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
          <p className="mt-2 text-lg text-text-secondary">
            Explore all our courses and find the perfect one for you.
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {allCourses.length} course{allCourses.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters */}
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedCategory === category 
                        ? 'bg-accent text-white' 
                        : 'text-text-secondary hover:bg-background-light'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Level</h3>
              <div className="space-y-2">
                {levels.map(level => (
                  <button
                    key={level}
                    onClick={() => handleLevelChange(level)}
                    className={`block w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedLevel === level 
                        ? 'bg-accent text-white' 
                        : 'text-text-secondary hover:bg-background-light'
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
                className="w-full px-4 py-2 bg-background-light text-text-primary text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Reset Filters
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
                <h3 className="text-xl font-medium text-text-primary">No courses found</h3>
                <p className="mt-2 text-text-secondary">Try adjusting your filters</p>
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
          <div className="w-16 h-16 border-4 border-t-accent border-gray-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading courses...</p>
        </div>
      </div>
    }>
      <CourseContent />
    </Suspense>
  );
}
