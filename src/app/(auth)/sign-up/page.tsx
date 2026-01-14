'use client';

import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-accent">BiiAMind</h1>
          </Link>
          <p className="mt-2 text-text-secondary">
            Create your account to start learning
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-background-light rounded-lg border border-gray-800 p-8">
          <AuthView pathname="sign-up" />
        </div>

        {/* Footer links */}
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
