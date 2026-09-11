// Transactional email via the Resend REST API — same approach as
// src/lib/payments/stripe.ts and src/lib/auth.ts: no SDK for a handful of calls.
//
// These sends must never break the flow that triggered them. A student who
// passes an exam gets their certificate whether or not the email goes out, so
// every failure here is logged and swallowed. (auth.ts throws instead, because
// a password reset with no email is a dead end for the user.)

const FROM = 'BiiA LAB <no-reply@biialab.org>';

export function siteOrigin(): string {
  return process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://www.biialab.org';
}

async function send(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('email: RESEND_API_KEY not set — skipping', JSON.stringify({ subject }));
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error('email: resend rejected', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('email: send failed', error);
    return false;
  }
}

const shell = (body: string) => `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#131316">
${body}
<hr style="border:none;border-top:1px solid #e5e2dc;margin:32px 0 16px">
<p style="color:#8a8a93;font-size:12px;line-height:1.5">BiiA LAB · cursos gratuitos con certificado<br><a href="${siteOrigin()}" style="color:#8a8a93">biialab.org</a></p>
</div>`;

const button = (href: string, label: string) =>
  `<p style="margin:28px 0"><a href="${href}" style="background:#ff4d14;color:#fff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${label}</a></p>`;

// Sent the moment a certificate is first issued (i.e. the student just passed).
// This is the highest-intent moment there is, and until now nothing reached them.
export async function sendCertificateReady(opts: {
  to: string;
  name: string | null;
  courseTitle: string;
  certificateNumber: string;
  priceUsd: number | null;
}): Promise<boolean> {
  const url = `${siteOrigin()}/verify/${opts.certificateNumber}`;
  const saludo = opts.name ? `Hola ${opts.name},` : 'Hola,';
  const cta = opts.priceUsd === null
    ? button(url, 'Ver mi certificado')
    : button(url, `Activar mi certificado — USD $${opts.priceUsd}`);
  const nota = opts.priceUsd === null
    ? ''
    : `<p style="color:#62626c;line-height:1.6">Al activarlo puedes descargarlo en PDF y añadirlo a tu perfil de LinkedIn con un clic. Tu credencial queda verificable públicamente en biialab.org.</p>`;

  return send(
    opts.to,
    `Aprobaste: tu certificado de ${opts.courseTitle} está listo`,
    shell(`<h2 style="margin:0 0 16px;font-size:22px">Aprobaste el examen</h2>
<p style="color:#62626c;line-height:1.6">${saludo} acabas de aprobar el examen final de <strong style="color:#131316">${opts.courseTitle}</strong>. Tu certificado ya está emitido a tu nombre.</p>
<p style="color:#62626c;line-height:1.6">Credencial: <strong style="color:#131316;font-family:ui-monospace,monospace">${opts.certificateNumber}</strong></p>
${cta}
${nota}`),
  );
}

// Sent when payment lands (from the Stripe webhook, so it fires even if the
// buyer never came back to the site).
export async function sendCertificateUnlocked(opts: {
  to: string;
  name: string | null;
  courseTitle: string;
  certificateNumber: string;
}): Promise<boolean> {
  const url = `${siteOrigin()}/verify/${opts.certificateNumber}`;
  const saludo = opts.name ? `Hola ${opts.name},` : 'Hola,';

  return send(
    opts.to,
    `Tu certificado de ${opts.courseTitle} ya está activo`,
    shell(`<h2 style="margin:0 0 16px;font-size:22px">Certificado activado</h2>
<p style="color:#62626c;line-height:1.6">${saludo} tu pago se recibió y tu certificado de <strong style="color:#131316">${opts.courseTitle}</strong> quedó activo. Ya puedes descargarlo y compartirlo.</p>
<p style="color:#62626c;line-height:1.6">Credencial: <strong style="color:#131316;font-family:ui-monospace,monospace">${opts.certificateNumber}</strong></p>
${button(url, 'Ver y descargar mi certificado')}
<p style="color:#62626c;line-height:1.6">Desde esa página puedes añadirlo a LinkedIn. Cualquiera puede verificar su autenticidad con ese mismo enlace.</p>`),
  );
}
