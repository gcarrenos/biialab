import Link from 'next/link';
import type { Metadata } from 'next';
import { getCertificateByNumber } from '@/lib/db/actions/certificates';
import { DownloadPdfButton } from '@/components/certificates/DownloadPdfButton';
import { LinkedInAddButton } from '@/components/certificates/LinkedInAddButton';
import { UnlockCertificateButton } from '@/components/certificates/UnlockCertificateButton';

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
      <div className="mx-auto max-w-4xl">
        {/* Validity banner (hidden on print) */}
        {certificate.unlocked ? (
          <div className="print:hidden mb-8 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-300">
            <span className="text-green-700 text-2xl">✓</span>
            <div>
              <p className="text-green-700 font-semibold">Certificado verificado</p>
              <p className="text-text-secondary text-sm">
                Emitido por BiiA LAB · Credencial {certificate.certificateNumber}
              </p>
            </div>
          </div>
        ) : (
          <div className="print:hidden mb-8 flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300">
            <span className="text-amber-700 text-2xl">!</span>
            <div>
              <p className="text-amber-700 font-semibold">Certificado pendiente de activación</p>
              <p className="text-text-secondary text-sm">
                {certificate.isOwner
                  ? 'Aprobaste el examen final. Activa tu certificado para descargarlo en PDF y añadirlo a LinkedIn.'
                  : 'Esta credencial existe pero aún no ha sido activada por su titular.'}
              </p>
            </div>
          </div>
        )}

        {/* The certificate — mirrors the downloadable PDF layout */}
        <div className="relative border border-accent bg-white shadow-sm p-1.5 print:border-black">
          {!certificate.unlocked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none overflow-hidden">
              <p className="font-display uppercase text-5xl md:text-7xl font-bold text-text-primary/10 -rotate-12 whitespace-nowrap select-none">
                Vista previa
              </p>
            </div>
          )}
          <div className="border border-accent/30 flex flex-col md:flex-row">
            {/* Main panel */}
            <div className="flex-1 p-8 md:p-12 text-left">
              <p className="text-sm text-text-secondary mb-6">{issued}</p>
              <h2 className="text-3xl font-bold text-text-primary leading-none">
                BiiA<span className="text-accent">Lab</span>
              </h2>
              <p className="text-[10px] tracking-[0.25em] text-text-secondary mt-1">BIIALAB.ORG</p>

              <p className="text-text-secondary text-sm mt-10 mb-3">certifica que</p>
              <p className="font-display uppercase text-3xl md:text-5xl font-bold text-text-primary mb-6">
                {certificate.studentName}
              </p>

              <p className="text-text-secondary text-sm mb-2">completó satisfactoriamente el curso</p>
              <p className="font-display uppercase text-xl md:text-3xl font-semibold text-text-primary mb-2">
                {certificate.courseTitle}
              </p>
              <p className="text-xs text-text-secondary">
                {['Curso online gratuito de BiiA LAB', certificate.courseCategory, certificate.totalLessons ? `${certificate.totalLessons} lecciones` : null]
                  .filter(Boolean).join(' · ')}
              </p>

              <div className="mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div>
                  <p className="text-sm font-semibold text-text-primary border-t border-text-primary pt-2 min-w-44">
                    {certificate.instructorName ?? 'BiiA LAB'}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {certificate.instructorName ? 'Instructor del curso' : 'Plataforma educativa'}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="font-mono text-sm font-semibold text-text-primary mb-1">{certificate.certificateNumber}</p>
                  <p className="text-[11px] text-text-secondary leading-relaxed max-w-60">
                    Verifica esta credencial en www.biialab.org/verify/{certificate.certificateNumber}.
                    Emitido tras aprobar el examen final del curso.
                  </p>
                </div>
              </div>
            </div>

            {/* Ribbon panel */}
            <div className="md:w-52 bg-[#faf6f2] border-t md:border-t-0 md:border-l border-[#eaded4] flex flex-row md:flex-col items-center justify-center md:justify-start gap-6 md:gap-0 p-6 md:pt-12">
              <div className="text-center">
                <p className="font-display uppercase tracking-[0.25em] text-text-primary font-semibold">Certificado</p>
                <p className="text-[10px] tracking-[0.2em] uppercase text-text-secondary mt-1">de curso</p>
              </div>
              <div className="md:mt-14" aria-hidden="true">
                <svg width="110" height="110" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="56" stroke="#ff4d14" strokeWidth="2" fill="none" />
                  <circle cx="60" cy="60" r="49" stroke="#f3b9a4" strokeWidth="1" fill="none" />
                  <circle cx="60" cy="60" r="34" fill="#ff4d14" />
                  <path d="M46 60 L56 70 L76 50" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="hidden md:block text-[9px] tracking-[0.2em] uppercase text-text-secondary mt-4">
                Educación gratuita
              </p>
            </div>
          </div>
        </div>

        {/* Actions (hidden on print) */}
        <div className="print:hidden mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {certificate.unlocked ? (
            <>
              <LinkedInAddButton href={linkedInAddUrl(certificate)} courseSlug={certificate.courseSlug} />
              <DownloadPdfButton certificateNumber={certificate.certificateNumber} courseSlug={certificate.courseSlug} />
            </>
          ) : certificate.isOwner && certificate.priceUsd !== null ? (
            <UnlockCertificateButton
              certificateNumber={certificate.certificateNumber}
              courseSlug={certificate.courseSlug}
              priceUsd={certificate.priceUsd}
            />
          ) : null}
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
