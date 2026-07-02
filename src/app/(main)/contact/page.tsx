'use client';

import { useState } from 'react';
import { submitContactMessage } from '@/lib/db/actions/waitlist';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message.trim()) return;
    setStatus('loading');
    try {
      const result = await submitContactMessage(email, message);
      setStatus(result.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-background min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">Escríbenos</h1>
        <p className="text-text-secondary mb-10">
          ¿Tienes una pregunta, una propuesta de colaboración o quieres enseñar en
          BiiALab? Déjanos tu mensaje y te respondemos.
        </p>

        {status === 'success' ? (
          <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
            <span className="text-green-400 text-lg font-medium">
              ✓ Mensaje recibido. Te contactaremos pronto.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="w-full px-4 py-3 bg-background-light border border-gray-800 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-text-secondary mb-2">
                Mensaje
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={6}
                maxLength={2000}
                disabled={status === 'loading'}
                className="w-full px-4 py-3 bg-background-light border border-gray-800 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
            </div>
            {status === 'error' && (
              <p className="text-red-400 text-sm">Hubo un error enviando el mensaje. Intenta de nuevo.</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando…' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
