'use client';

import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-accent">BiiAMind</h1>
          </Link>
          <p className="mt-2 text-text-secondary">
            Sign in to access your courses
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-background-light rounded-lg border border-gray-800 p-8">
          <AuthView pathname="sign-in" />
        </div>

        {/* Footer links */}
        <p className="text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
