import Link from 'next/link';
import type { Metadata } from 'next';
import { getCertificateByNumber } from '@/lib/db/actions/certificates';
import { PrintButton } from '@/components/certificates/PrintButton';
import { LinkedInAddButton } from '@/components/certificates/LinkedInAddButton';

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
    organizationId: '9339183', // BiiA LAB LinkedIn Company Page — attaches the page logo
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
        <div className="print:hidden mb-8 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-300">
          <span className="text-green-700 text-2xl">✓</span>
          <div>
            <p className="text-green-700 font-semibold">Certificado verificado</p>
            <p className="text-text-secondary text-sm">
              Emitido por BiiA LAB · Credencial {certificate.certificateNumber}
            </p>
          </div>
        </div>

        {/* The certificate */}
        <div className="rounded-2xl border-2 border-accent/40 bg-white shadow-sm p-10 md:p-14 text-center print:border-black">
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
          <LinkedInAddButton href={linkedInAddUrl(certificate)} courseSlug={certificate.courseSlug} />
          <PrintButton />
          <Link
            href={`/courses/${certificate.courseSlug}`}
            className="px-6 py-3 rounded-lg border border-gray-300 text-text-primary hover:border-accent font-medium transition-colors"
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
