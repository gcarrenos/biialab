'use client';

import { track } from '@/lib/analytics';

export function DownloadPdfButton({ certificateNumber, courseSlug }: { certificateNumber: string; courseSlug: string }) {
  return (
    <a
      href={`/api/certificates/${certificateNumber}/pdf`}
      download
      onClick={() => track('certificate_download', { course: courseSlug })}
      className="px-6 py-3 rounded-lg border border-gray-300 text-text-primary hover:border-accent font-medium transition-colors"
    >
      Descargar PDF
    </a>
  );
}
