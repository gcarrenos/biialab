'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

export function BuyDiplomadoButton({ priceUsd }: { priceUsd: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError(false);
    track('diplomado_checkout_start');
    try {
      const res = await fetch('/api/checkout/diplomado', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={startCheckout}
        disabled={loading}
        className="px-10 py-4 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-60 text-white text-lg font-semibold transition-colors"
      >
        {loading ? 'Redirigiendo…' : `Reservar mi lugar — USD $${priceUsd}`}
      </button>
      {error && <p className="text-sm text-red-600">No se pudo iniciar el pago. Intenta de nuevo.</p>}
      <p className="text-xs text-text-secondary">Pago único y seguro con Stripe. Precio de fundador por tiempo limitado.</p>
    </div>
  );
}
