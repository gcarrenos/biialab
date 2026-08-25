'use client';

import { useState } from 'react';
import Image from 'next/image';
import { registerInterest } from '@/lib/db/actions/interest';

export interface ComingSoonClass {
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  level: string;
  instructorName: string;
  thumbnail: string;
}

export function ComingSoonCard({ item }: { item: ComingSoonClass }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'already' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    setStatus('sending');
    const result = await registerInterest(email, item.slug);
    if (result.success) {
      setStatus(result.message === 'already' ? 'already' : 'done');
      try { localStorage.setItem('biialab_interest_email', email); } catch {}
    } else {
      setStatus('error');
    }
  }

  function openForm() {
    if (!open) {
      try {
        const saved = localStorage.getItem('biialab_interest_email');
        if (saved) setEmail(saved);
      } catch {}
      setOpen(true);
    }
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-surface border border-gray-200 shadow-sm transition-all hover:shadow-md">
      <div className="relative overflow-hidden aspect-video bg-background-light">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute top-2 right-2 bg-text-primary/85 text-white px-2 py-1 text-xs font-semibold rounded z-20">
          Próximamente
        </div>
      </div>

      <div className="flex flex-col flex-grow p-4">
        <div className="flex items-center gap-2 mb-1 text-xs text-text-secondary">
          <span>{item.category}</span>
          <span aria-hidden="true">·</span>
          <span>{item.level}</span>
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-2">{item.title}</h3>
        <p className="text-sm text-text-secondary line-clamp-3 mb-4 flex-grow">{item.shortDescription}</p>

        {status === 'done' || status === 'already' ? (
          <p className="text-sm font-semibold text-accent">
            {status === 'done' ? 'Listo, te avisamos cuando salga ✓' : 'Ya estabas en la lista de esta clase ✓'}
          </p>
        ) : !open ? (
          <button
            type="button"
            onClick={openForm}
            className="w-full rounded-lg border border-accent text-accent hover:bg-accent hover:text-white transition-colors px-4 py-2 text-sm font-semibold"
          >
            Avísame cuando salga
          </button>
        ) : (
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {status === 'sending' ? '…' : 'Avisarme'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-xs text-red-600">No se pudo registrar, intenta de nuevo.</p>
        )}
      </div>
    </div>
  );
}
