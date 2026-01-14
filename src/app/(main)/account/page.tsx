'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { currentUser } from '@/lib/data';
import { courses } from '@/lib/data';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('courses');
  
  // Get user's courses with progress
  const userCourses = currentUser.progress.map(progress => {
    const course = courses.find(c => c.id === progress.courseId);
    return { course, progress };
  }).filter(item => item.course);
  
  // Separate completed and in-progress courses
  const completedCourses = userCourses.filter(item => item.progress.completed);
  const inProgressCourses = userCourses.filter(item => !item.progress.completed);

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Account Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-full bg-background-light">
              {currentUser.avatar ? (
                <Image 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-4xl text-text-secondary">
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{currentUser.name}</h1>
              <p className="text-text-secondary mt-1">{currentUser.email}</p>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="bg-background-light rounded-lg px-4 py-2">
                  <p className="text-xs text-text-secondary">Courses Enrolled</p>
                  <p className="text-xl font-semibold text-text-primary">{userCourses.length}</p>
                </div>
                <div className="bg-background-light rounded-lg px-4 py-2">
                  <p className="text-xs text-text-secondary">Courses Completed</p>
                  <p className="text-xl font-semibold text-text-primary">{completedCourses.length}</p>
                </div>
                <div className="bg-background-light rounded-lg px-4 py-2">
                  <p className="text-xs text-text-secondary">Certificates Earned</p>
                  <p className="text-xl font-semibold text-text-primary">
                    {userCourses.filter(item => item.progress.certificateId).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-800 mb-8">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'border-b-2 border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === 'certificates'
                  ? 'border-b-2 border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Certificates
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'border-b-2 border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div>
          {activeTab === 'courses' && (
            <div className="space-y-12">
              {/* In Progress */}
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-6">In Progress</h2>
                {inProgressCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {inProgressCourses.map(({ course, progress }) => (
                      <div key={course?.id} className="bg-background-light rounded-lg overflow-hidden">
                        <div className="relative h-48">
                          <Image 
                            src={course?.thumbnail || ''} 
                            alt={course?.title || ''}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-lg font-semibold text-white">{course?.title}</h3>
                            <p className="text-sm text-gray-300 mt-1">{course?.instructor.name}</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-text-secondary">Progress</span>
                            <span className="text-sm font-medium text-text-primary">{progress.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full" 
                              style={{ width: `${progress.progress}%` }}
                            ></div>
                          </div>
                          <div className="mt-4">
                            <Link
                              href={
                                progress.currentLessonId 
                                  ? `/courses/${course?.id}/lessons/${progress.currentLessonId}`
                                  : course?.modules && course?.modules[0]?.lessons[0]?.id
                                    ? `/courses/${course?.id}/lessons/${course?.modules[0].lessons[0].id}`
                                    : `/courses/${course?.id}`
                              }
                              className="block w-full text-center py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                            >
                              Continue Learning
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-background-light rounded-lg">
                    <p className="text-text-secondary">You have no courses in progress.</p>
                    <Link
                      href="/courses"
                      className="inline-block mt-4 px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      Explore Courses
                    </Link>
                  </div>
                )}
              </section>
              
              {/* Completed */}
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-6">Completed</h2>
                {completedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {completedCourses.map(({ course, progress }) => (
                      <div key={course?.id} className="bg-background-light rounded-lg overflow-hidden">
                        <div className="relative h-48">
                          <Image 
                            src={course?.thumbnail || ''}
                            alt={course?.title || ''}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-lg font-semibold text-white">{course?.title}</h3>
                            <p className="text-sm text-gray-300 mt-1">{course?.instructor.name}</p>
                          </div>
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Completed
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-text-secondary">Completed on</span>
                            <span className="text-sm font-medium text-text-primary">{progress.completedDate}</span>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Link
                              href={`/courses/${course?.id}`}
                              className="flex-1 text-center py-2 border border-gray-700 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors"
                            >
                              Review Course
                            </Link>
                            {progress.certificateId && (
                              <Link
                                href={`/certificate/${progress.certificateId}`}
                                className="flex-1 text-center py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                              >
                                View Certificate
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-background-light rounded-lg">
                    <p className="text-text-secondary">You haven't completed any courses yet.</p>
                  </div>
                )}
              </section>
            </div>
          )}
          
          {activeTab === 'certificates' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">My Certificates</h2>
              {completedCourses.filter(item => item.progress.certificateId).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {completedCourses
                    .filter(item => item.progress.certificateId)
                    .map(({ course, progress }) => (
                      <div key={course?.id} className="bg-background-light rounded-lg overflow-hidden border border-gray-800">
                        <div className="p-6">
                          <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-accent/10">
                              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-bold text-text-primary">{course?.title}</h3>
                            <p className="text-sm text-text-secondary mt-1">Issued on {progress.completedDate}</p>
                          </div>
                          <div className="mt-6">
                            <Link
                              href={`/certificate/${progress.certificateId}`}
                              className="block w-full text-center py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                            >
                              View Certificate
                            </Link>
                            <button
                              className="block w-full text-center py-2 border border-gray-700 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors mt-2"
                            >
                              Download PDF
                            </button>

                    <button
  className="block w-full text-center py-2 border border-gray-700 text-text-primary rounded-md text-sm font-medium hover:bg-background transition-colors mt-2 flex items-center justify-center"
  onClick={() => {
    const certUrl = `${window.location.origin}/certificate/${progress.certificateId}`;
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(course?.title || '')}&organizationId=9339183&organizationName=BIIA%20Lab&issueYear=${new Date(progress.completedDate).getFullYear()}&issueMonth=${new Date(progress.completedDate).getMonth() + 1}&certUrl=${encodeURIComponent(certUrl)}&certId=${progress.certificateId}`;
    window.open(linkedInUrl, '_blank');
  }}
>
  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
  Add to LinkedIn
</button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-background-light rounded-lg">
                  <p className="text-text-secondary">You haven't earned any certificates yet.</p>
                  <p className="text-text-secondary mt-2">Complete a course to earn a certificate.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-6">Account Settings</h2>
              <div className="bg-background-light rounded-lg p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary"
                      value={currentUser.name}
                      readOnly
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary"
                      value={currentUser.email}
                      readOnly
                    />
                  </div>
                  <div className="pt-4">
                    <button
                      className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
                      disabled
                    >
                      Update Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 