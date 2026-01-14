'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/courses' },
    { name: 'About', href: '/about' },
    { name: 'Social Impact', href: '/social-impact' },
    { name: 'Partnerships', href: '/partnerships' },
  ];

  return (
    <header className="bg-background border-b border-gray-800">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">BiiAMind</span>
            <h1 className="text-2xl font-bold text-text-primary">BiiA<span className="text-accent">Mind</span></h1>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="text-sm font-semibold leading-6 text-text-primary hover:text-accent transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          <Link 
            href="/account" 
            className="flex items-center text-sm font-semibold leading-6 text-text-primary hover:text-accent transition-colors"
          >
            <UserCircleIcon className="h-6 w-6 mr-1" />
            <span>My Account</span>
          </Link>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-background-light p-6 text-left align-middle shadow-xl">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-text-primary">BiiA<span className="text-accent">Mind</span></h1>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 divide-y divide-gray-800">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block py-3 text-base font-medium text-text-primary hover:text-accent"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href="/account"
                    className="block py-3 text-base font-medium text-text-primary hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 