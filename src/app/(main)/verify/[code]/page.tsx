import Link from 'next/link';
import type { Metadata } from 'next';
import { getCertificateByNumber } from '@/lib/db/actions/certificates';
import { PrintButton } from '@/components/certificates/PrintButton';

export const metadata: Metadata = {
  title: 'Verificación de certificado | BiiALab',
  description: 'Verifica la autenticidad de un certificado emitido por BiiALab.',
};

const BASE_URL = 'https://www.biialab.org';

function linkedInAddUrl(cert: { certificateNumber: string; courseTitle: string; issuedAt: string }) {
  const issued = new Date(cert.issuedAt);
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.courseTitle,
    organizationName: 'BiiA LAB',
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certUrl: `${BASE_URL}/verify/${cert.certificateNumber}`,
    certId: cert.certificateNumber,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { certificate } = await getCertificateByNumber(decodeURIComponent(code));

  if (!certificate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">✕</div>
          <h1 className="font-display uppercase text-2xl font-bold text-text-primary mb-3">
            Certificado no encontrado
          </h1>
          <p className="text-text-secondary">
            El código <span className="font-mono text-text-primary">{decodeURIComponent(code)}</span> no
            corresponde a ningún certificado emitido por BiiALab.
          </p>
        </div>
      </div>
    );
  }

  const issued = new Date(certificate.issuedAt).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="bg-background min-h-screen py-16 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Validity banner (hidden on print) */}
        <div className="print:hidden mb-8 flex items-center gap-3 p-4 rounded-xl bg-green-900/20 border border-green-700">
          <span className="text-green-400 text-2xl">✓</span>
          <div>
            <p className="text-green-400 font-semibold">Certificado verificado</p>
            <p className="text-text-secondary text-sm">
              Emitido por BiiA LAB · Credencial {certificate.certificateNumber}
            </p>
          </div>
        </div>

        {/* The certificate */}
        <div className="rounded-2xl border-2 border-accent/40 bg-background-light p-10 md:p-14 text-center print:border-black">
          <p className="font-display uppercase tracking-[0.3em] text-accent text-sm mb-6">Certificado</p>
          <h2 className="text-2xl font-bold text-text-primary mb-1">
            BiiA<span className="text-accent">Lab</span>
          </h2>
          <p className="text-text-secondary text-sm mb-10">certifica que</p>

          <p className="font-display uppercase text-3xl md:text-5xl font-bold text-text-primary mb-10">
            {certificate.studentName}
          </p>

          <p className="text-text-secondary text-sm mb-2">completó satisfactoriamente el curso</p>
          <p className="font-display uppercase text-xl md:text-3xl font-semibold text-text-primary mb-10">
            {certificate.courseTitle}
          </p>

          <div className="flex items-center justify-center gap-10 text-sm text-text-secondary">
            <div>
              <p className="font-medium text-text-primary">{issued}</p>
              <p>Fecha de emisión</p>
            </div>
            <div>
              <p className="font-mono font-medium text-text-primary">{certificate.certificateNumber}</p>
              <p>Credencial</p>
            </div>
          </div>
        </div>

        {/* Actions (hidden on print) */}
        <div className="print:hidden mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={linkedInAddUrl(certificate)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0a66c2] hover:bg-[#0a66c2]/90 text-white font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
            </svg>
            Añadir a LinkedIn
          </a>
          <PrintButton />
          <Link
            href={`/courses/${certificate.courseSlug}`}
            className="px-6 py-3 rounded-lg border border-gray-700 text-text-primary hover:border-accent font-medium transition-colors"
          >
            Ver el curso
          </Link>
        </div>

        <p className="print:hidden mt-6 text-center text-xs text-text-secondary">
          Cualquier persona puede verificar esta credencial en {BASE_URL.replace('https://', '')}/verify/{certificate.certificateNumber}
        </p>
      </div>
    </div>
  );
}
