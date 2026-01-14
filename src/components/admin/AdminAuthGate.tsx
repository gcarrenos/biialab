'use client';

import { useState, useEffect } from 'react';

const ADMIN_PASSWORD_KEY = 'biialab_admin_auth';

export function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const storedAuth = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check password against environment variable or hardcoded for now
    // In production, this should be a server-side check
    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (data.success) {
      sessionStorage.setItem(ADMIN_PASSWORD_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-background-light rounded-lg border border-gray-800 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
              <p className="text-text-secondary text-sm mt-2">
                Ingresa la contraseña para acceder al panel de administración
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
                className="w-full py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md transition-colors"
              >
                Acceder
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                ← Volver al inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show children with logout button
  return (
    <div className="relative">
      {children}
      <button
        onClick={handleLogout}
        className="fixed top-4 right-4 z-[60] px-3 py-1.5 text-xs text-text-secondary hover:text-white bg-background-light hover:bg-red-600 rounded-md border border-gray-800 hover:border-red-600 transition-all"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
