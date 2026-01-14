'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { currentUser } from '@/lib/data';
import { courses } from '@/lib/data';

interface UserDetailProps {
  params: {
    id: string;
  };
}

export default function UserDetail({ params }: UserDetailProps) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Get a real or dummy user based on the ID
  const getDummyUser = (id: string) => {
    if (id === 'u1' || id === currentUser.id) return currentUser;
    
    if (id === 'u2') {
      return {
        id: 'u2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://picsum.photos/200/200?random=user1',
        progress: [
          {
            courseId: '2',
            progress: 45,
            completed: false,
            completedLessons: [],
          },
          {
            courseId: '4',
            progress: 80,
            completed: false,
            completedLessons: [],
          }
        ]
      };
    }
    
    if (id === 'u3') {
      return {
        id: 'u3',
        name: 'Michael Johnson',
        email: 'michael@example.com',
        avatar: 'https://picsum.photos/200/200?random=user2',
        progress: [
          {
            courseId: '3',
            progress: 100,
            completed: true,
            completedDate: '2023-10-20',
            certificateId: 'cert-002',
            completedLessons: [],
          }
        ]
      };
    }
    
    return null;
  };
  
  // Form state
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
    avatar: '',
  });
  
  // User progress data
  const [userProgress, setUserProgress] = useState<any[]>([]);
  
  useEffect(() => {
    if (isNew) {
      setUserData({
        id: `u${Date.now()}`,
        name: '',
        email: '',
        avatar: '',
      });
      setUserProgress([]);
      setIsLoading(false);
      return;
    }
    
    const user = getDummyUser(params.id);
    if (!user) {
      router.push('/admin/users');
      return;
    }
    
    setUserData({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
    });
    
    // Set user progress and get course details
    const progressWithCourseDetails = user.progress.map(progress => {
      const course = courses.find(c => c.id === progress.courseId);
      return { ...progress, course };
    });
    
    setUserProgress(progressWithCourseDetails);
    setIsLoading(false);
  }, [params.id, router, isNew]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit user:', userData);
    // In a real app, you would save the user data to a database here
    router.push('/admin/users');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-accent border-gray-800 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading user data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">
          {isNew ? 'Add New User' : 'User Details'}
        </h1>
        <div className="flex gap-4">
          <Link 
            href="/admin/users"
            className="px-4 py-2 border border-gray-800 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Save User
          </button>
        </div>
      </div>
      
      {/* User Header */}
      <div className="bg-background-light rounded-lg border border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-background">
            {userData.avatar ? (
              <Image 
                src={userData.avatar}
                alt={userData.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full text-4xl text-text-secondary bg-accent/10">
                {userData.name ? userData.name.charAt(0) : '?'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-primary">{userData.name || 'New User'}</h2>
            <p className="text-text-secondary">{userData.email || 'No email provided'}</p>
            <div className="mt-2 flex gap-2">
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded-md text-xs">
                User ID: {userData.id}
              </span>
              {!isNew && (
                <span className="px-2 py-0.5 bg-background text-text-secondary rounded-md text-xs">
                  {userProgress.length} Courses
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-4 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Profile
          </button>
          {!isNew && (
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'border-b-2 border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Courses
            </button>
          )}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                  Full Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Enter email address"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-text-secondary mb-2">
                Avatar URL
              </label>
              <input
                type="text"
                id="avatar"
                name="avatar"
                value={userData.avatar}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter avatar URL (optional)"
              />
              <p className="mt-1 text-xs text-text-secondary">
                Leave blank to use initials. You can use <a href="https://picsum.photos/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Lorem Picsum</a> for placeholder images.
              </p>
            </div>
            
            {!isNew && (
              <div className="pt-4 mt-4 border-t border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-text-primary">Danger Zone</h3>
                </div>
                <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-500 mb-2">Delete User Account</h4>
                  <p className="text-xs text-text-secondary mb-4">
                    This action cannot be undone. This will permanently delete the user account and all associated data.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete user "${userData.name}"? This action cannot be undone.`)) {
                        console.log('Delete user:', userData.id);
                        router.push('/admin/users');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
        
        {activeTab === 'courses' && !isNew && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">Enrolled Courses</h2>
              <button
                type="button"
                onClick={() => console.log('Enroll in course')}
                className="px-3 py-1.5 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Enroll in Course
              </button>
            </div>
            
            {userProgress.length === 0 ? (
              <div className="text-center py-12 bg-background-light rounded-lg border border-gray-800">
                <p className="text-text-secondary">This user is not enrolled in any courses yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userProgress.map((progress) => (
                  <div key={progress.courseId} className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative sm:w-48 h-36 sm:h-auto">
                        {progress.course && (
                          <Image 
                            src={progress.course.thumbnail}
                            alt={progress.course.title}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-text-primary">
                              {progress.course ? progress.course.title : 'Unknown Course'}
                            </h3>
                            <p className="text-sm text-text-secondary mt-1">
                              {progress.course ? progress.course.instructor.name : 'Unknown Instructor'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {progress.completed ? (
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md text-xs">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md text-xs">
                                In Progress
                              </span>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to unenroll this user from this course?')) {
                                  console.log('Unenroll from course:', progress.courseId);
                                  // In a real app, you would remove the enrollment here
                                }
                              }}
                              className="text-red-500 hover:text-red-400 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-text-secondary">Progress</span>
                            <span className="text-xs font-medium text-text-primary">{progress.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div 
                              className="bg-accent h-1.5 rounded-full" 
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {progress.completed && progress.completedDate && (
                          <div className="mt-3 text-xs text-text-secondary">
                            Completed on: {progress.completedDate}
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              console.log('Edit progress for course:', progress.courseId);
                            }}
                            className="text-xs text-accent hover:underline"
                          >
                            Edit Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 