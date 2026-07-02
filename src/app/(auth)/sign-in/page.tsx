'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: signInError } = await signIn.email({ email, password });

    if (signInError) {
      setError(
        signInError.status === 401 || /invalid/i.test(signInError.message ?? '')
          ? 'Correo o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. Intenta de nuevo.'
      );
      setIsLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-text-primary">
              BiiA<span className="text-accent">Lab</span>
            </h1>
          </Link>
          <p className="mt-2 text-text-secondary">Inicia sesión para acceder a tus cursos</p>
        </div>

        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-md text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{' '}
          <Link href="/sign-up" className="text-accent hover:underline">
            Crea una gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
