'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { subscribeToWaitlist } from '@/lib/db/actions/waitlist';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

export default function ComingSoonPage() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');

  useEffect(() => {
    if (!vantaEffect && isLoaded && window.VANTA) {
      setVantaEffect(
        window.VANTA.HALO({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          baseColor: 0x0a0a0a,
          backgroundColor: 0x0a0a0a,
          amplitudeFactor: 1.2,
          size: 1.2,
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect, isLoaded]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    try {
      const result = await subscribeToWaitlist(email);
      
      if (result.success) {
        if (result.message === 'already_subscribed') {
          setStatus('already');
        } else {
          setStatus('success');
          setEmail('');
        }
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
    }
  };

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsLoaded(true)}
      />

      <div
        ref={vantaRef}
        className="fixed inset-0 min-h-screen w-full overflow-hidden"
      >
        {/* Dark overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
          {/* Logo/Brand */}
          <div className="mb-6 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight drop-shadow-2xl">
              <span className="text-white">
                BiiA
              </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                Lab
              </span>
            </h1>
          </div>

          {/* Coming Soon Badge */}
          <div className="mb-8 animate-fade-in-delay-1">
            <span className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-md border border-white/20 shadow-lg">
              🚀 Próximamente
            </span>
          </div>

          {/* Tagline */}
          <div className="max-w-2xl text-center mb-10 animate-fade-in-delay-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight drop-shadow-lg">
              ¡Estudia en la plataforma educativa más grande de Latinoamérica!
            </h2>
            <p className="text-base md:text-lg text-white/80 drop-shadow-md">
              Cursos de AI, Machine Learning y tecnología de vanguardia.
            </p>
          </div>

          {/* Email Signup */}
          <div className="w-full max-w-md mb-8 animate-fade-in-delay-3">
            {status === 'idle' || status === 'loading' || status === 'error' ? (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu correo electrónico"
                  required
                  disabled={status === 'loading'}
                  className="flex-1 px-5 py-4 rounded-xl bg-black/40 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-md transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:transform-none"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    'Notifícame'
                  )}
                </button>
              </form>
            ) : status === 'success' ? (
              <div className="text-center p-5 rounded-xl bg-green-500/20 border border-green-500/40 backdrop-blur-md">
                <span className="text-green-300 text-lg font-medium">
                  ✓ ¡Gracias! Te avisaremos cuando lancemos.
                </span>
              </div>
            ) : status === 'already' ? (
              <div className="text-center p-5 rounded-xl bg-blue-500/20 border border-blue-500/40 backdrop-blur-md">
                <span className="text-blue-300 text-lg font-medium">
                  Ya estás en la lista. ¡Te avisaremos pronto!
                </span>
              </div>
            ) : null}

            {status === 'error' && (
              <p className="text-red-400 text-sm text-center mt-3">
                Hubo un error. Por favor intenta de nuevo.
              </p>
            )}
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-6 mb-6 animate-fade-in-delay-4">
            <a href="#" className="text-white/50 hover:text-white transition-colors p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </a>
            <a href="#" className="text-white/50 hover:text-white transition-colors p-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-white/40 text-sm animate-fade-in-delay-4">
            © 2026 BiiALab. Todos los derechos reservados.
          </p>
        </div>

        {/* Bypass Button - Small and subtle */}
        <Link
          href="/home"
          className="fixed bottom-4 right-4 z-50 px-3 py-1.5 text-xs text-white/30 hover:text-white/70 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-sm border border-white/10 transition-all"
        >
            &nbsp;
        </Link>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-delay-1 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.2s forwards;
        }
        .animate-fade-in-delay-2 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.4s forwards;
        }
        .animate-fade-in-delay-3 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.6s forwards;
        }
        .animate-fade-in-delay-4 {
          opacity: 0;
          animation: fade-in 0.8s ease-out 0.8s forwards;
        }
      `}</style>
    </>
  );
}
