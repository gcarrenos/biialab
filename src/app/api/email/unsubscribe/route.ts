import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyUnsubscribeToken } from '@/lib/email';

export const maxDuration = 30;

// One click, no login, no confirmation step. The link is signed so it only works
// for the person it was mailed to. Opting out stops reminders; receipts and
// password resets keep working, which is what the page says.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('u') ?? '';
  const token = url.searchParams.get('t') ?? '';

  const page = (title: string, body: string) =>
    new Response(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · BiiA LAB</title></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:48px 24px;color:#131316">
<h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
${body}
<p style="margin-top:32px"><a href="https://www.biialab.org" style="color:#ff4d14">Ir a biialab.org</a></p>
</body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );

  if (!userId || !verifyUnsubscribeToken(userId, token)) {
    return page('Enlace no válido', '<p style="color:#62626c;line-height:1.6">Este enlace no es válido o ya expiró. Si quieres dejar de recibir recordatorios, escríbenos desde la página de contacto.</p>');
  }

  try {
    await db.update(users).set({ emailOptout: true }).where(eq(users.id, userId));
  } catch (error) {
    console.error('unsubscribe error:', error);
    return page('Algo salió mal', '<p style="color:#62626c;line-height:1.6">No pudimos procesar tu baja. Inténtalo de nuevo en un momento.</p>');
  }

  return page(
    'Listo, no te escribimos más',
    '<p style="color:#62626c;line-height:1.6">No volverás a recibir recordatorios de cursos. Seguirás recibiendo lo esencial: el aviso de tu certificado cuando apruebes un examen, el recibo si compras uno, y el correo para restablecer tu contraseña.</p>',
  );
}
