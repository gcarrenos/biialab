// Transactional and reminder email via the Resend REST API — same approach as
// src/lib/payments/stripe.ts: no SDK for a handful of calls.
//
// Everything here is written for email clients, not browsers: tables instead of
// flex, every style inline, explicit colours on every element (so dark mode can't
// invert text onto the same colour), absolute image URLs, and a bulletproof
// button built from a padded table cell rather than a styled <a>.
//
// These sends must never break the flow that triggered them. A student who passes
// an exam gets their certificate whether or not the email goes out, so failures
// are logged and swallowed. (auth.ts throws instead, because a password reset
// with no email is a dead end.)

import { createHmac, timingSafeEqual } from 'node:crypto';

const FROM = 'BiiA LAB <no-reply@biialab.org>';

const INK = '#14110e';
const INK_SOFT = '#5c5348';
const ACCENT = '#ff4d14';
const PAPER = '#f4f1ec';
const CARD = '#ffffff';
const LINE = '#e7e1d8';

export function siteOrigin(): string {
  return process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ?? 'https://www.biialab.org';
}

// Stateless unsubscribe: the link carries the user id plus an HMAC of it, so no
// token table is needed and it can't be forged for somebody else.
export function unsubscribeToken(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? '';
  return createHmac('sha256', secret).update(`unsub:${userId}`).digest('hex').slice(0, 32);
}

export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const a = Buffer.from(unsubscribeToken(userId), 'utf8');
  const b = Buffer.from(token ?? '', 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
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

// ---------------------------------------------------------------- pieces

// Shows as the grey preview line next to the subject in most inboxes. Padded so
// the client doesn't pull body copy in after it.
const preheader = (text: string) =>
  `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${text}${'&#847;&zwnj;&nbsp;'.repeat(60)}</div>`;

const brandBar = `<tr><td style="background-color:${INK};padding:22px 32px" align="left">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="padding-right:11px" valign="middle">
      <img src="${siteOrigin()}/email/logo-mark.png" width="34" height="34" alt="BiiA LAB"
           style="display:block;border:0;border-radius:9px" />
    </td>
    <td valign="middle" style="font-family:Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;letter-spacing:-0.2px;color:#ffffff">
      BiiA<span style="color:${ACCENT}">Lab</span>
    </td>
  </tr></table>
</td></tr>`;

const footer = (userId?: string) => `<tr><td style="padding:22px 32px 30px;background-color:${PAPER};border-top:1px solid ${LINE}">
  <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:#8d8377">
    Cursos gratuitos con certificado verificable.<br />
    <a href="${siteOrigin()}" style="color:#8d8377;text-decoration:underline">biialab.org</a>${
      userId
        ? ` &nbsp;·&nbsp; <a href="${siteOrigin()}/api/email/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}" style="color:#8d8377;text-decoration:underline">no quiero estos recordatorios</a>`
        : ''
    }
  </p>
</td></tr>`;

// Outer scaffold. The nested 600px table is what keeps Outlook honest.
function layout(opts: { preview: string; body: string; userId?: string }): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" /><meta name="supported-color-schemes" content="light only" />
</head>
<body style="margin:0;padding:0;background-color:${PAPER};-webkit-font-smoothing:antialiased">
${preheader(opts.preview)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER}">
<tr><td align="center" style="padding:28px 12px 40px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
         style="width:600px;max-width:600px;background-color:${CARD};border-radius:14px;overflow:hidden;border:1px solid ${LINE}">
    ${brandBar}
    <tr><td style="padding:34px 32px 30px">${opts.body}</td></tr>
    ${footer(opts.userId)}
  </table>
</td></tr></table>
</body></html>`;
}

const eyebrow = (text: string) =>
  `<p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:${ACCENT}">${text}</p>`;

const h1 = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:27px;line-height:33px;font-weight:700;letter-spacing:-0.4px;color:${INK}">${text}</h1>`;

const p = (html: string) =>
  `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:25px;color:${INK_SOFT}">${html}</p>`;

const strong = (t: string) => `<strong style="color:${INK};font-weight:600">${t}</strong>`;

// Padded table cell, not a styled anchor: this is the shape that survives Outlook.
const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px"><tr>
    <td align="center" bgcolor="${ACCENT}" style="background-color:${ACCENT};border-radius:9px">
      <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9px">${label}</a>
    </td></tr></table>`;

// Two table cells whose widths carry the ratio — renders identically everywhere,
// unlike anything based on a div with a percentage width.
function progress(done: number, total: number): string {
  const pct = Math.max(6, Math.min(100, Math.round((done / total) * 100)));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px">
    <tr><td style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.5px;color:${INK_SOFT};padding-bottom:8px">
      ${done} DE ${total} CLASES
    </td></tr>
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:5px;overflow:hidden;background-color:#ece6dd">
        <tr>
          <td width="${pct}%" style="background-color:${ACCENT};height:9px;line-height:9px;font-size:0">&nbsp;</td>
          <td width="${100 - pct}%" style="background-color:#ece6dd;height:9px;line-height:9px;font-size:0">&nbsp;</td>
        </tr>
      </table>
    </td></tr></table>`;
}

// The credential rendered like something you'd actually keep.
const credential = (number: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 20px">
    <tr><td style="background-color:${PAPER};border:1px solid ${LINE};border-radius:10px;padding:16px 20px">
      <p style="margin:0 0 5px;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8d8377">Credencial</p>
      <p style="margin:0;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:17px;font-weight:700;letter-spacing:0.6px;color:${INK}">${number}</p>
    </td></tr></table>`;

const greet = (name: string | null) => (name ? `Hola ${name},` : 'Hola,');

// ---------------------------------------------------------------- transactional

// Sent the moment a certificate is first issued (i.e. they just passed). The
// highest-intent moment there is, and until recently nothing reached them.
export async function sendCertificateReady(opts: {
  to: string; name: string | null; courseTitle: string; certificateNumber: string; priceUsd: number | null;
}): Promise<boolean> {
  const url = `${siteOrigin()}/verify/${opts.certificateNumber}`;
  return send(opts.to, `Aprobaste: tu certificado de ${opts.courseTitle} está listo`, layout({
    preview: `Tu certificado de ${opts.courseTitle} ya está emitido a tu nombre.`,
    body: `${eyebrow('Examen aprobado')}
${h1('Tu certificado está listo')}
${p(`${greet(opts.name)} acabas de aprobar el examen final de ${strong(opts.courseTitle)}. Tu certificado ya está emitido a tu nombre.`)}
${credential(opts.certificateNumber)}
${opts.priceUsd === null
  ? button(url, 'Ver mi certificado')
  : `${button(url, `Activar mi certificado — USD $${opts.priceUsd}`)}
${p('Al activarlo puedes descargarlo en PDF y añadirlo a tu perfil de LinkedIn con un clic. Queda verificable públicamente por cualquiera que reciba el enlace.')}`}`,
  }));
}

// Sent when payment lands, from the Stripe webhook, so it arrives even if the
// buyer never came back to the site.
export async function sendCertificateUnlocked(opts: {
  to: string; name: string | null; courseTitle: string; certificateNumber: string;
}): Promise<boolean> {
  const url = `${siteOrigin()}/verify/${opts.certificateNumber}`;
  return send(opts.to, `Tu certificado de ${opts.courseTitle} ya está activo`, layout({
    preview: 'Pago recibido. Ya puedes descargar y compartir tu certificado.',
    body: `${eyebrow('Pago recibido')}
${h1('Certificado activado')}
${p(`${greet(opts.name)} tu certificado de ${strong(opts.courseTitle)} quedó activo. Ya puedes descargarlo y compartirlo.`)}
${credential(opts.certificateNumber)}
${button(url, 'Ver y descargar mi certificado')}
${p('Desde esa página puedes añadirlo a LinkedIn. Cualquiera puede verificar su autenticidad con ese mismo enlace.')}`,
  }));
}

// ---------------------------------------------------------------- reminders
// Only to users who have not opted out; every one carries an unsubscribe link
// and the caller records the send so nobody gets it twice.

// For someone who enrolled and never opened a lesson — the biggest group on the
// platform. The ask is deliberately small: one class.
export async function sendStartCourse(opts: {
  to: string; userId: string; name: string | null; courseTitle: string; courseSlug: string; totalLessons: number;
}): Promise<boolean> {
  const url = `${siteOrigin()}/courses/${opts.courseSlug}`;
  return send(opts.to, `Tu primera clase de ${opts.courseTitle} te espera`, layout({
    preview: `Son ${opts.totalLessons} clases. Puedes ver una sola hoy.`,
    userId: opts.userId,
    body: `${eyebrow('Te inscribiste, no has empezado')}
${h1('Empieza por la primera clase')}
${p(`${greet(opts.name)} te inscribiste en ${strong(opts.courseTitle)} y todavía no has visto la primera clase.`)}
${p(`No hace falta hacerlo de una sentada: son ${strong(String(opts.totalLessons) + ' clases')} y puedes ver una sola hoy. Al terminar el curso y aprobar el examen recibes un certificado verificable.`)}
${button(url, 'Ver la primera clase')}`,
  }));
}

// For someone who started and stopped. Naming the exact number left is the whole
// point: "te faltan 2" is a very different ask from "vuelve al curso".
export async function sendResumeCourse(opts: {
  to: string; userId: string; name: string | null; courseTitle: string; courseSlug: string; done: number; remaining: number;
}): Promise<boolean> {
  const url = `${siteOrigin()}/courses/${opts.courseSlug}`;
  const total = opts.done + opts.remaining;
  const faltan = opts.remaining === 1 ? 'Te falta 1 clase' : `Te faltan ${opts.remaining} clases`;
  return send(opts.to, `${faltan} de ${opts.courseTitle}`, layout({
    preview: `Llevas ${opts.done} de ${total}. Sigue donde quedaste.`,
    userId: opts.userId,
    body: `${eyebrow('Lo dejaste a medias')}
${h1(faltan)}
${p(`${greet(opts.name)} avanzaste en ${strong(opts.courseTitle)} y quedaste a mitad de camino.`)}
${progress(opts.done, total)}
${p('Cuando las termines puedes presentar el examen final y obtener tu certificado verificable, listo para LinkedIn.')}
${button(url, 'Seguir donde quedaste')}`,
  }));
}
