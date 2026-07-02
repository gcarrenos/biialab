'use client';

import { useState } from 'react';
import { submitContactMessage, subscribeToWaitlist } from '@/lib/db/actions/waitlist';

const ASUNTOS = [
  'Quiero enseñar en BiiALab',
  'Colaboración o alianza',
  'Soporte',
  'Otro',
];

export default function ContactPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [asunto, setAsunto] = useState(ASUNTOS[0]);
  const [mensaje, setMensaje] = useState('');
  const [optIn, setOptIn] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email || !mensaje.trim()) return;
    setStatus('loading');
    try {
      const result = await submitContactMessage(email, `[${asunto}] ${nombre}: ${mensaje}`);
      if (optIn) {
        await subscribeToWaitlist(email, 'contact-optin');
      }
      setStatus(result.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-background min-h-[70vh] py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-2xl bg-background-light p-8 sm:p-12">
        <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-3">
          Conecta con nosotros
        </p>
        <h1 className="font-display uppercase text-3xl md:text-4xl font-semibold text-text-primary mb-4 tracking-tight">
          Cuéntanos qué necesitas.
        </h1>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-text-secondary mb-2">
                  Nombre*
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 bg-surface border border-gray-700/50 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Correo electrónico*
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 bg-surface border border-gray-700/50 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="asunto" className="block text-sm font-medium text-text-secondary mb-2">
                Asunto
              </label>
              <select
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                disabled={status === 'loading'}
                className="w-full px-4 py-3 bg-surface border border-gray-700/50 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              >
                {ASUNTOS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mensaje" className="block text-sm font-medium text-text-secondary mb-2">
                Mensaje*
              </label>
              <textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                required
                rows={6}
                maxLength={2000}
                disabled={status === 'loading'}
                className="w-full px-4 py-3 bg-surface border border-gray-700/50 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => setOptIn(e.target.checked)}
                disabled={status === 'loading'}
                className="h-4 w-4 rounded border-gray-700/50 bg-surface text-accent focus:ring-accent focus:ring-offset-0 disabled:opacity-50"
              />
              Mantenerme al día con nuevos cursos
            </label>

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
