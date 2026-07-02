'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { UserMenu } from '@/components/auth/UserMenu';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const navigation = [
    { name: 'Cursos', href: '/courses' },
    { name: 'Impacto social', href: '/social-impact' },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const trimmed = searchValue.trim();
    router.push(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
  };

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex items-center gap-6 flex-shrink-0">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">BiiALab</span>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">BiiA<span className="text-accent">Lab</span></h1>
          </Link>
          <div className="hidden lg:flex lg:items-center lg:gap-6">
            <Link
              href="/courses"
              className="whitespace-nowrap text-sm font-semibold leading-6 text-text-primary hover:text-accent transition-colors"
            >
              Cursos
            </Link>
          </div>
        </div>

        <div className="flex lg:hidden ml-auto">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-text-secondary"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:max-w-md">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Busca cursos: 'ventas', 'IA'…"
              className="w-full rounded-full bg-background-light border border-gray-200 py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="hidden lg:flex lg:flex-shrink-0 lg:items-center lg:gap-6 lg:justify-end">
          <Link
            href="/social-impact"
            className="whitespace-nowrap text-sm font-semibold leading-6 text-text-primary hover:text-accent transition-colors"
          >
            Impacto social
          </Link>
          <UserMenu />
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold tracking-tight text-text-primary">BiiA<span className="text-accent">Lab</span></h1>
                  <button
                    type="button"
                    className="text-text-secondary hover:text-text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Cerrar menú</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                    <input
                      type="search"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onKeyDown={(e) => {
                        handleSearchKeyDown(e);
                        if (e.key === 'Enter') setMobileMenuOpen(false);
                      }}
                      placeholder="Busca cursos: 'ventas', 'IA'…"
                      className="w-full rounded-full bg-background-light border border-gray-200 py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                </div>
                <div className="mt-4 divide-y divide-gray-200">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
