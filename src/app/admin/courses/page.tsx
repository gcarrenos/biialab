'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { courses, instructors } from '@/lib/data';

export default function CoursesAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Get unique categories
  const categories = Array.from(new Set(courses.map(course => course.category)));
  
  // Filter courses based on search term and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || course.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Courses Management</h1>
        <Link 
          href="/admin/courses/new"
          className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Add New Course
        </Link>
      </div>
      
      {/* Filters */}
      <div className="bg-background-light p-6 rounded-lg border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-text-secondary mb-2">
              Search Courses
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="sm:w-1/3">
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">
              Filter by Category
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Courses Table */}
      <div className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-12 bg-background-light p-4 border-b border-gray-800 text-sm font-medium">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">Course</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Instructor</div>
          <div className="col-span-1">Level</div>
          <div className="col-span-1">Lessons</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        <div className="divide-y divide-gray-800">
          {filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <div key={course.id} className="grid grid-cols-12 p-4 items-center hover:bg-background transition-colors text-sm">
                <div className="col-span-1">
                  <span className="text-text-secondary">{course.id}</span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded">
                      <Image 
                        src={course.thumbnail} 
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{course.title}</p>
                      <p className="text-xs text-text-secondary truncate max-w-xs">{course.description.slice(0, 60)}...</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-1 bg-background rounded-full text-xs font-medium text-text-primary">
                    {course.category}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full">
                      <Image 
                        src={course.instructor.avatar} 
                        alt={course.instructor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-text-primary text-xs">{course.instructor.name}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <span className="text-text-secondary">{course.level}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-text-secondary">{course.lessons}</span>
                </div>
                <div className="col-span-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="p-1.5 bg-background hover:bg-accent/10 rounded text-text-secondary hover:text-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      target="_blank"
                      className="p-1.5 bg-background hover:bg-accent/10 rounded text-text-secondary hover:text-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <button
                      className="p-1.5 bg-background hover:bg-red-900/10 rounded text-text-secondary hover:text-red-500 transition-colors"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
                          console.log('Delete course:', course.id);
                          // In a real app, you would delete the course here
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-text-secondary">
              No courses found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 