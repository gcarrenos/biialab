'use client';

import { useState, useEffect } from 'react';

interface WaitlistEntry {
  id: string;
  email: string;
  source: string | null;
  subscribedAt: string;
  isVerified: boolean | null;
}

export default function AdminWaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthorized' | 'error'>('loading');

  useEffect(() => {
    const password = sessionStorage.getItem('biialab_admin_auth');
    if (!password || password === 'true') {
      setStatus('unauthorized');
      return;
    }

    fetch('/api/admin/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(async (res) => {
        if (res.status === 401) {
          setStatus('unauthorized');
          return;
        }
        const data = await res.json();
        if (data.success) {
          setEntries(data.emails);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, []);

  const exportCsv = () => {
    const header = 'email,source,subscribed_at\n';
    const rows = entries
      .map((e) => `${e.email},${e.source ?? ''},${e.subscribedAt}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biialab-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Waitlist</h1>
          <p className="text-text-secondary mt-1">
            {status === 'ready'
              ? `${entries.length} correos registrados`
              : 'Correos registrados en la página de lanzamiento'}
          </p>
        </div>
        {status === 'ready' && entries.length > 0 && (
          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-md transition-colors"
          >
            Exportar CSV
          </button>
        )}
      </div>

      {status === 'loading' && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {status === 'unauthorized' && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded-md text-yellow-400 text-sm">
          Tu sesión no tiene credenciales válidas. Cierra sesión y vuelve a ingresar la contraseña.
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
          Error cargando la lista. Intenta de nuevo.
        </div>
      )}

      {status === 'ready' && entries.length === 0 && (
        <div className="p-8 bg-background-light border border-gray-800 rounded-lg text-center text-text-secondary">
          Aún no hay correos registrados.
        </div>
      )}

      {status === 'ready' && entries.length > 0 && (
        <div className="bg-background-light border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-text-secondary">
                <th className="px-6 py-4 font-medium">Correo</th>
                <th className="px-6 py-4 font-medium">Origen</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800/50 last:border-0">
                  <td className="px-6 py-3 text-text-primary">{entry.email}</td>
                  <td className="px-6 py-3 text-text-secondary">{entry.source ?? '—'}</td>
                  <td className="px-6 py-3 text-text-secondary">
                    {new Date(entry.subscribedAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
