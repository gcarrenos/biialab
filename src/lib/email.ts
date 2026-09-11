// Transactional email via the Resend REST API — same approach as
// src/lib/payments/stripe.ts and src/lib/auth.ts: no SDK for a handful of calls.
//
// These sends must never break the flow that triggered them. A student who
// passes an exam gets their certificate whether or not the email goes out, so
// every failure here is logged and swallowed. (auth.ts throws instead, because
// a password reset with no email is a dead end for the user.)

import { createHmac, timingSafeEqual } from 'node:crypto';

const FROM = 'BiiA LAB <no-reply@biialab.org>';

// Stateless unsubscribe: the link carries the user id plus an HMAC of it, so no
// token table is needed and the link can't be forged or guessed for someone else.
export function unsubscribeToken(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(`unsub:${userId}`).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const a = Buffer.from(unsubscribeToken(userId), 'utf8');
  const b = Buffer.from(token ?? '', 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

function unsubscribeUrl(userId: string): string {
  return `${siteOrigin()}/api/email/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}`;
}

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

// Marketing-shaped email carries an unsubscribe link; transactional does not
// (a receipt with "stop receiving receipts" makes no sense).
const shellWithOptOut = (body: string, userId: string) => `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#131316">
${body}
<hr style="border:none;border-top:1px solid #e5e2dc;margin:32px 0 16px">
<p style="color:#8a8a93;font-size:12px;line-height:1.5">BiiA LAB · cursos gratuitos con certificado<br>
<a href="${siteOrigin()}" style="color:#8a8a93">biialab.org</a> · <a href="${unsubscribeUrl(userId)}" style="color:#8a8a93">no quiero estos recordatorios</a></p>
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

// ---------------------------------------------------------------- re-engagement
// Both of these are reminders, not receipts: they only go to users who have not
// opted out, they carry an unsubscribe link, and the caller records each send so
// nobody gets the same one twice.

// For someone who enrolled and never opened a single lesson. This is the biggest
// group on the platform by far, so the ask is deliberately small: one class.
export async function sendStartCourse(opts: {
  to: string;
  userId: string;
  name: string | null;
  courseTitle: string;
  courseSlug: string;
  totalLessons: number;
}): Promise<boolean> {
  const url = `${siteOrigin()}/courses/${opts.courseSlug}`;
  const saludo = opts.name ? `Hola ${opts.name},` : 'Hola,';

  return send(
    opts.to,
    `Tu primera clase de ${opts.courseTitle} te espera`,
    shellWithOptOut(`<h2 style="margin:0 0 16px;font-size:22px">Empieza por la primera clase</h2>
<p style="color:#62626c;line-height:1.6">${saludo} te inscribiste en <strong style="color:#131316">${opts.courseTitle}</strong> y todavía no has visto la primera clase.</p>
<p style="color:#62626c;line-height:1.6">No hace falta que lo hagas de una sentada: son ${opts.totalLessons} clases y puedes ver una sola hoy. Al terminar el curso y aprobar el examen recibes un certificado verificable.</p>
${button(url, 'Ver la primera clase')}`, opts.userId),
  );
}

// For someone who started and stopped. Naming the exact number left is the whole
// point: "te faltan 2" is a very different ask from "vuelve al curso".
export async function sendResumeCourse(opts: {
  to: string;
  userId: string;
  name: string | null;
  courseTitle: string;
  courseSlug: string;
  done: number;
  remaining: number;
}): Promise<boolean> {
  const url = `${siteOrigin()}/courses/${opts.courseSlug}`;
  const saludo = opts.name ? `Hola ${opts.name},` : 'Hola,';
  const faltan = opts.remaining === 1 ? 'te falta 1 clase' : `te faltan ${opts.remaining} clases`;

  return send(
    opts.to,
    `${faltan.charAt(0).toUpperCase()}${faltan.slice(1)} de ${opts.courseTitle}`,
    shellWithOptOut(`<h2 style="margin:0 0 16px;font-size:22px">Ya llevas ${opts.done} ${opts.done === 1 ? 'clase' : 'clases'}</h2>
<p style="color:#62626c;line-height:1.6">${saludo} avanzaste en <strong style="color:#131316">${opts.courseTitle}</strong> y quedaste a mitad de camino: ${faltan}.</p>
<p style="color:#62626c;line-height:1.6">Cuando las termines puedes presentar el examen final y obtener tu certificado verificable, listo para LinkedIn.</p>
${button(url, 'Seguir donde quedaste')}`, opts.userId),
  );
}
