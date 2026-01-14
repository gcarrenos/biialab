'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CourseCard from '@/components/courses/CourseCard';
import { courses } from '@/lib/data';

function CourseContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [filteredCourses, setFilteredCourses] = useState(courses);
  
  const categories = [...new Set(courses.map(course => course.category))];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  
  useEffect(() => {
    let result = courses;
    
    if (selectedCategory) {
      result = result.filter(course => course.category === selectedCategory);
    }
    
    if (selectedLevel) {
      result = result.filter(course => course.level === selectedLevel);
    }
    
    setFilteredCourses(result);
  }, [selectedCategory, selectedLevel]);
  
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

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="border-b border-gray-800 pb-8 mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
          <p className="mt-2 text-lg text-text-secondary">
            Explore all our courses and find the perfect one for you.
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