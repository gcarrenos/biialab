'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setStatus('loading');
    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (resetError) {
      setStatus('error');
      setError('El enlace expiró o no es válido. Solicita uno nuevo.');
      return;
    }
    router.push('/sign-in');
  };

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-text-primary font-medium">Enlace inválido</p>
        <p className="text-text-secondary text-sm">
          Falta el código de recuperación.{' '}
          <Link href="/forgot-password" className="text-accent hover:underline">Solicita uno nuevo</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
          Nueva contraseña <span className="text-text-secondary/60">(mínimo 8 caracteres)</span>
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-background border border-gray-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Guardando…' : 'Guardar nueva contraseña'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-text-primary">
              BiiA<span className="text-accent">Lab</span>
            </h1>
          </Link>
          <p className="mt-2 text-text-secondary">Crea tu nueva contraseña</p>
        </div>
        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-8">
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
