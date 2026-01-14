'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { currentUser } from '@/lib/data';
import { courses } from '@/lib/data';

export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // In a real app, this would be a list of users
  // For demo purposes, we'll use the currentUser and create some dummy users
  const dummyUsers = [
    currentUser,
    {
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
    },
    {
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
    }
  ];
  
  // Filter users based on search term
  const filteredUsers = dummyUsers.filter(user => {
    return searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Users Management</h1>
        <Link 
          href="/admin/users/new"
          className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          Add New User
        </Link>
      </div>
      
      {/* Search */}
      <div className="bg-background-light p-6 rounded-lg border border-gray-800">
        <label htmlFor="search" className="block text-sm font-medium text-text-secondary mb-2">
          Search Users
        </label>
        <input
          type="text"
          id="search"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      
      {/* Users Table */}
      <div className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-12 bg-background-light p-4 border-b border-gray-800 text-sm font-medium">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Email</div>
          <div className="col-span-2">Courses</div>
          <div className="col-span-2">Completed</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        
        <div className="divide-y divide-gray-800">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => {
              const userCourses = user.progress.map(p => courses.find(c => c.id === p.courseId)).filter(Boolean);
              const completedCourses = user.progress.filter(p => p.completed).length;
              
              return (
                <div key={user.id} className="grid grid-cols-12 p-4 items-center hover:bg-background transition-colors text-sm">
                  <div className="col-span-1">
                    <span className="text-text-secondary">{user.id}</span>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                        {user.avatar ? (
                          <Image 
                            src={user.avatar}
                            alt={user.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-accent flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{user.name}</p>
                        <p className="text-xs text-text-secondary">User</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-secondary">{user.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-secondary">{user.progress.length}</span>
                    {user.progress.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {userCourses.slice(0, 2).map(course => course && (
                          <span 
                            key={course.id} 
                            className="px-1.5 py-0.5 bg-background rounded text-xs text-text-secondary"
                            title={course.title}
                          >
                            {course.title.length > 15 ? course.title.slice(0, 15) + '...' : course.title}
                          </span>
                        ))}
                        {user.progress.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-background rounded text-xs text-text-secondary">
                            +{user.progress.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-secondary">{completedCourses} / {user.progress.length}</span>
                    {user.progress.length > 0 && (
                      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-accent h-1.5 rounded-full" 
                          style={{ width: `${(completedCourses / user.progress.length) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-1.5 bg-background hover:bg-accent/10 rounded text-text-secondary hover:text-accent transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <button
                        className="p-1.5 bg-background hover:bg-accent/10 rounded text-text-secondary hover:text-accent transition-colors"
                        onClick={() => console.log('View user progress:', user.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 bg-background hover:bg-red-900/10 rounded text-text-secondary hover:text-red-500 transition-colors"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user "${user.name}"?`)) {
                            console.log('Delete user:', user.id);
                            // In a real app, you would delete the user here
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
              );
            })
          ) : (
            <div className="p-8 text-center text-text-secondary">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 