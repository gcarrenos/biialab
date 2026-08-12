import { NextResponse } from 'next/server';
import { getCertificateByNumber } from '@/lib/db/actions/certificates';
import { buildCertificatePdf } from '@/lib/certificates/pdf';

export const maxDuration = 30;

// Renders the certificate as a real PDF (react-pdf), replacing the old
// window.print() flow. Public, like the /verify page it mirrors.
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { certificate } = await getCertificateByNumber(decodeURIComponent(code));

  if (!certificate) {
    return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 });
  }

  if (!certificate.unlocked) {
    return NextResponse.json(
      { error: 'Certificado pendiente de activación' },
      { status: 402 },
    );
  }

  try {
    // Fonts live in /public and are fetched from this same deployment, so
    // previews and production both resolve without configuration.
    const origin = new URL(request.url).origin;
    const pdf = await buildCertificatePdf(certificate, origin);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificado-biialab-${certificate.certificateNumber}.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('certificate pdf error:', error);
    return NextResponse.json({ error: 'No se pudo generar el PDF' }, { status: 500 });
  }
}
