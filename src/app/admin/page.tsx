import Link from 'next/link';
import { courses, currentUser } from '@/lib/data';

export default function AdminDashboard() {
  // Calculate some basic stats
  const totalCourses = courses.length;
  const totalUsers = 1; // Since we only have one user in our sample data
  const totalEnrollments = currentUser.progress.length;
  const courseCompletionRate = Math.round(
    (currentUser.progress.filter(p => p.completed).length / totalEnrollments) * 100
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-text-primary">{totalCourses}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/admin/courses" 
              className="text-sm text-accent hover:underline"
            >
              View all courses
            </Link>
          </div>
        </div>
        
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Users</p>
              <p className="text-3xl font-bold text-text-primary">{totalUsers}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              href="/admin/users" 
              className="text-sm text-accent hover:underline"
            >
              View all users
            </Link>
          </div>
        </div>
        
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Total Enrollments</p>
              <p className="text-3xl font-bold text-text-primary">{totalEnrollments}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-background-light p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-text-primary">{courseCompletionRate}%</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text-primary">Recent Activity</h2>
        <div className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-medium text-text-primary">Latest Enrollments</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {currentUser.progress.slice(0, 3).map((progress) => {
              const course = courses.find(c => c.id === progress.courseId);
              return (
                <div key={progress.courseId} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{course?.title || 'Unknown Course'}</p>
                    <p className="text-sm text-text-secondary mt-1">{currentUser.name}</p>
                  </div>
                  <div className="text-xs text-text-secondary">
                    {progress.completed ? 'Completed' : 'In Progress'} - {progress.progress}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text-primary">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link 
            href="/admin/courses/new" 
            className="flex items-center p-4 bg-background-light rounded-lg border border-gray-800 hover:border-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text-primary">Add New Course</p>
              <p className="text-xs text-text-secondary mt-1">Create a new course with modules and lessons</p>
            </div>
          </Link>
          
          <Link 
            href="/admin/users/new" 
            className="flex items-center p-4 bg-background-light rounded-lg border border-gray-800 hover:border-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text-primary">Add New User</p>
              <p className="text-xs text-text-secondary mt-1">Create a new user account</p>
            </div>
          </Link>
          
          <Link 
            href="/admin/settings" 
            className="flex items-center p-4 bg-background-light rounded-lg border border-gray-800 hover:border-accent transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-text-primary">Platform Settings</p>
              <p className="text-xs text-text-secondary mt-1">Configure platform settings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 