'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <AdminAuthGate>
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-background-light text-text-primary border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-accent">BiiAMind Admin</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link 
                href="/admin" 
                className={`flex items-center p-3 text-sm rounded-md transition-colors ${
                  isActive('/admin') && !isActive('/admin/courses') && !isActive('/admin/users')
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/courses" 
                className={`flex items-center p-3 text-sm rounded-md transition-colors ${
                  isActive('/admin/courses')
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Courses
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/users" 
                className={`flex items-center p-3 text-sm rounded-md transition-colors ${
                  isActive('/admin/users')
                    ? 'bg-accent text-white' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users
              </Link>
            </li>
            <li>
              <Link 
                href="/admin/youtube" 
                className={`flex items-center p-3 text-sm rounded-md transition-colors ${
                  isActive('/admin/youtube')
                    ? 'bg-red-600 text-white' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-background'
                }`}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                YouTube
              </Link>
            </li>
            <li className="pt-4 mt-4 border-t border-gray-800">
              <Link 
                href="/" 
                className="flex items-center p-3 text-sm rounded-md transition-colors text-text-secondary hover:text-text-primary hover:bg-background"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
                Back to Site
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background-light border-b border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Admin Dashboard</h2>
            <div className="flex items-center">
              <span className="text-sm text-text-secondary mr-4">Admin User</span>
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-white">
                A
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
    </AdminAuthGate>
  );
} 