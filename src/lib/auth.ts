import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import { users, sessions, accounts, verifications } from '@/lib/db/schema';

// Server-side auth instance (better-auth + Drizzle/Neon).
// Client-side helpers live in src/lib/auth-client.ts.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.biialab.org',
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Email via Resend REST API. Without RESEND_API_KEY the request is
      // rejected loudly so the failure is visible in logs, not silent.
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        console.error('RESEND_API_KEY not set — cannot send password reset email');
        throw new Error('email_not_configured');
      }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          from: 'BiiALab <no-reply@biialab.org>',
          to: [user.email],
          subject: 'Restablece tu contraseña de BiiALab',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#131316">Restablecer contraseña</h2>
            <p style="color:#62626c">Hola ${user.name ?? ''}, recibimos una solicitud para restablecer tu contraseña en BiiALab. Este enlace expira en 1 hora.</p>
            <p style="margin:28px 0"><a href="${url}" style="background:#ff4d14;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Crear nueva contraseña</a></p>
            <p style="color:#62626c;font-size:13px">Si no solicitaste este cambio, ignora este correo — tu contraseña seguirá siendo la misma.</p>
          </div>`,
        }),
      });
      if (!res.ok) {
        console.error('Resend error:', res.status, await res.text().catch(() => ''));
        throw new Error('email_send_failed');
      }
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user',
        input: false, // never settable from the client
      },
    },
  },
  advanced: {
    database: {
      // Schema uses uuid columns; better-auth defaults to random strings.
      generateId: () => crypto.randomUUID(),
    },
  },
});
