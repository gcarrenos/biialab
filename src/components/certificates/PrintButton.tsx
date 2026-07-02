'use client';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-6 py-3 rounded-lg border border-gray-700 text-text-primary hover:border-accent font-medium transition-colors"
    >
      Descargar / Imprimir
    </button>
  );
}
