'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { courses, instructors } from '@/lib/data';

interface CourseEditProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function CourseEdit({ params }: CourseEditProps) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [courseData, setCourseData] = useState({
    id: '',
    title: '',
    description: '',
    instructorId: '',
    thumbnail: 'https://picsum.photos/800/450?random=101',
    category: '',
    duration: '',
    lessons: 0,
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    isFeatured: false,
  });
  
  // Modules state (simplified for this example)
  const [modules, setModules] = useState<Array<{
    id: string;
    title: string;
    lessons: Array<{
      id: string;
      title: string;
      description: string;
      duration: string;
    }>;
  }>>([]);
  
  useEffect(() => {
    if (isNew) {
      setIsLoading(false);
      return;
    }
    
    // Find the course by ID
    const course = courses.find(c => c.id === params.id);
    if (!course) {
      router.push('/admin/courses');
      return;
    }
    
    // Set the form data
    setCourseData({
      id: course.id,
      title: course.title,
      description: course.description,
      instructorId: course.instructor.id,
      thumbnail: course.thumbnail,
      category: course.category,
      duration: course.duration,
      lessons: course.lessons,
      level: course.level,
      isFeatured: course.isFeatured || false,
    });
    
    // Set modules if they exist
    if (course.modules) {
      setModules(course.modules.map(module => ({
        id: module.id,
        title: module.title,
        lessons: module.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
        }))
      })));
    }
    
    setIsLoading(false);
  }, [params.id, router, isNew]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit course:', courseData);
    console.log('Modules:', modules);
    // In a real app, you would save the course data to a database here
    router.push('/admin/courses');
  };
  
  // Function to add a new empty module
  const addModule = () => {
    setModules(prev => [
      ...prev,
      {
        id: `module-${Date.now()}`,
        title: 'New Module',
        lessons: [],
      }
    ]);
  };
  
  // Function to add a new lesson to a module
  const addLesson = (moduleId: string) => {
    setModules(prev => prev.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [
            ...module.lessons,
            {
              id: `lesson-${Date.now()}`,
              title: 'New Lesson',
              description: 'Lesson description',
              duration: '10:00',
            }
          ]
        };
      }
      return module;
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-accent border-gray-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading course data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">
          {isNew ? 'Add New Course' : 'Edit Course'}
        </h1>
        <div className="flex gap-4">
          <Link 
            href="/admin/courses"
            className="px-4 py-2 border border-gray-800 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Save Course
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Course Information */}
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold text-text-primary mb-6">Course Information</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">
                  Course Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={courseData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">
                  Category*
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  required
                  value={courseData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. Artificial Intelligence, Data Science, etc."
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-2">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={courseData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Provide a detailed description of the course"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="instructorId" className="block text-sm font-medium text-text-secondary mb-2">
                  Instructor*
                </label>
                <select
                  id="instructorId"
                  name="instructorId"
                  required
                  value={courseData.instructorId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-text-secondary mb-2">
                  Level*
                </label>
                <select
                  id="level"
                  name="level"
                  required
                  value={courseData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-2">
                  Duration*
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  required
                  value={courseData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="e.g. 8 weeks"
                />
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={courseData.isFeatured}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 block text-sm text-text-secondary">
                Feature this course on the homepage
              </label>
            </div>
          </div>
        </div>
        
        {/* Course Thumbnail */}
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <h2 className="text-xl font-bold text-text-primary mb-6">Course Thumbnail</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="thumbnail" className="block text-sm font-medium text-text-secondary mb-2">
                Thumbnail URL
              </label>
              <input
                type="text"
                id="thumbnail"
                name="thumbnail"
                value={courseData.thumbnail}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter thumbnail URL"
              />
              <p className="mt-2 text-xs text-text-secondary">
                Recommended size: 800x450 pixels. You can use <a href="https://picsum.photos/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Lorem Picsum</a> for placeholder images.
              </p>
            </div>
            <div>
              <p className="block text-sm font-medium text-text-secondary mb-2">
                Preview
              </p>
              <div className="relative h-40 w-full overflow-hidden rounded-md border border-gray-800">
                <Image 
                  src={courseData.thumbnail} 
                  alt="Thumbnail Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Modules and Lessons */}
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary">Curriculum</h2>
            <button
              type="button"
              onClick={addModule}
              className="px-3 py-1.5 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              Add Module
            </button>
          </div>
          
          {modules.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-gray-800 rounded-md">
              <p className="text-text-secondary mb-4">No modules added yet.</p>
              <button
                type="button"
                onClick={addModule}
                className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Add First Module
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-800 rounded-md overflow-hidden">
                  <div className="bg-background p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-accent">{moduleIndex + 1}.</span>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => {
                          const newModules = [...modules];
                          newModules[moduleIndex].title = e.target.value;
                          setModules(newModules);
                        }}
                        className="px-2 py-1 bg-background border border-gray-800 rounded text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Module Title"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addLesson(module.id)}
                        className="px-2 py-1 bg-background border border-gray-800 text-text-secondary rounded text-xs hover:border-accent hover:text-accent transition-colors"
                      >
                        Add Lesson
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModules(modules.filter(m => m.id !== module.id));
                        }}
                        className="px-2 py-1 bg-background border border-gray-800 text-text-secondary rounded text-xs hover:border-red-500 hover:text-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {module.lessons.length === 0 ? (
                      <div className="p-4 text-center border border-dashed border-gray-800 rounded-md">
                        <p className="text-sm text-text-secondary">No lessons added to this module yet.</p>
                      </div>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="bg-background p-3 rounded-md">
                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex items-center gap-2 md:w-2/5">
                              <span className="text-xs text-text-secondary">{moduleIndex + 1}.{lessonIndex + 1}</span>
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => {
                                  const newModules = [...modules];
                                  newModules[moduleIndex].lessons[lessonIndex].title = e.target.value;
                                  setModules(newModules);
                                }}
                                className="w-full px-2 py-1 bg-background border border-gray-800 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                placeholder="Lesson Title"
                              />
                            </div>
                            <input
                              type="text"
                              value={lesson.duration}
                              onChange={(e) => {
                                const newModules = [...modules];
                                newModules[moduleIndex].lessons[lessonIndex].duration = e.target.value;
                                setModules(newModules);
                              }}
                              className="w-full md:w-24 px-2 py-1 bg-background border border-gray-800 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                              placeholder="Duration"
                            />
                            <div className="flex-1">
                              <input
                                type="text"
                                value={lesson.description}
                                onChange={(e) => {
                                  const newModules = [...modules];
                                  newModules[moduleIndex].lessons[lessonIndex].description = e.target.value;
                                  setModules(newModules);
                                }}
                                className="w-full px-2 py-1 bg-background border border-gray-800 rounded text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                                placeholder="Brief description"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newModules = [...modules];
                                newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
                                setModules(newModules);
                              }}
                              className="text-text-secondary hover:text-red-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-4">
          <Link 
            href="/admin/courses"
            className="px-4 py-2 border border-gray-800 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Save Course
          </button>
        </div>
      </form>
    </div>
  );
} 