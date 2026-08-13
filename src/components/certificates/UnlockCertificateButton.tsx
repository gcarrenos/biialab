'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

export function UnlockCertificateButton({
  certificateNumber,
  courseSlug,
  priceUsd,
}: {
  certificateNumber: string;
  courseSlug: string;
  priceUsd: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError(false);
    track('certificate_checkout_start', { course: courseSlug });
    try {
      const res = await fetch('/api/checkout/certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateNumber }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.alreadyUnlocked) {
        window.location.reload();
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
        className="px-8 py-3 rounded-lg bg-accent hover:bg-accent/90 disabled:opacity-60 text-white font-semibold transition-colors"
      >
        {loading ? 'Redirigiendo…' : `Activar mi certificado — USD $${priceUsd}`}
      </button>
      {error && (
        <p className="text-sm text-red-600">No se pudo iniciar el pago. Intenta de nuevo.</p>
      )}
    </div>
  );
}
