'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsLoading(true);

    const { error: signUpError } = await signUp.email({ name, email, password });

    if (signUpError) {
      setError(
        /exist/i.test(signUpError.message ?? '')
          ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
          : 'No pudimos crear tu cuenta. Intenta de nuevo.'
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
          <p className="mt-2 text-text-secondary">Crea tu cuenta gratis</p>
        </div>

        <div className="bg-background-light rounded-lg border border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
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
                className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Contraseña <span className="text-text-secondary/60">(mínimo 8 caracteres)</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link href="/sign-in" className="text-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
