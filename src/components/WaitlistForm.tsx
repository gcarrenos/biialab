'use client';

import { useState } from 'react';
import { subscribeToWaitlist } from '@/lib/db/actions/waitlist';

export function WaitlistForm({ source = 'homepage' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');

    try {
      const result = await subscribeToWaitlist(email, source);
      if (result.success) {
        setStatus(result.message === 'already_subscribed' ? 'already' : 'success');
        if (result.message !== 'already_subscribed') setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center p-4 rounded-xl bg-green-500/10 border border-green-500/30">
        <span className="text-green-400 font-medium">✓ ¡Listo! Te avisaremos de nuevos cursos.</span>
      </div>
    );
  }

  if (status === 'already') {
    return (
      <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <span className="text-blue-400 font-medium">Ya estás en la lista. ¡Te avisaremos pronto!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo electrónico"
        required
        disabled={status === 'loading'}
        className="flex-1 px-5 py-3 rounded-lg bg-background border border-gray-800 text-text-primary placeholder-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando…' : 'Notifícame'}
      </button>
      {status === 'error' && (
        <p className="text-red-400 text-sm sm:col-span-2">Hubo un error. Intenta de nuevo.</p>
      )}
    </form>
  );
}
