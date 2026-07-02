'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    });
    // Same success message regardless — never reveal whether the email exists
    setStatus(error && error.status !== 200 ? 'error' : 'sent');
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
          <p className="mt-2 text-text-secondary">Recupera el acceso a tu cuenta</p>
        </div>

        <div className="bg-surface rounded-xl border border-gray-200 shadow-sm p-8">
          {status === 'sent' ? (
            <div className="text-center space-y-3">
              <p className="text-text-primary font-medium">Revisa tu correo</p>
              <p className="text-text-secondary text-sm">
                Si existe una cuenta para <span className="font-medium">{email}</span>, te enviamos
                un enlace para crear una nueva contraseña. Expira en 1 hora.
              </p>
            </div>
          ) : (
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
                  className="w-full px-4 py-3 bg-background border border-gray-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              {status === 'error' && (
                <p className="text-red-600 text-sm text-center">
                  No pudimos enviar el correo. Intenta de nuevo en unos minutos.
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? 'Enviando…' : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary">
          <Link href="/sign-in" className="text-accent hover:underline">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
