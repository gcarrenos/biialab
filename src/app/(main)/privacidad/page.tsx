import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad | BiiALab',
  description: 'Cómo BiiALab recopila, usa y protege tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Política de privacidad</h1>
          <p className="text-text-secondary text-sm">Última actualización: julio de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Qué datos recopilamos</h2>
          <p className="text-text-secondary">
            Al crear una cuenta guardamos tu nombre, correo electrónico y contraseña (cifrada).
            Al usar la plataforma registramos tu progreso en los cursos, tus intentos de examen y
            los certificados que obtienes. Si te suscribes a nuestras novedades o nos escribes por
            el formulario de contacto, guardamos tu correo y tu mensaje.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Para qué los usamos</h2>
          <p className="text-text-secondary">
            Usamos tus datos únicamente para operar la plataforma: mantener tu sesión, guardar tu
            progreso, emitir y verificar tus certificados, responder tus mensajes y — solo si lo
            aceptaste — enviarte novedades sobre cursos. No vendemos tus datos a terceros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Certificados públicos</h2>
          <p className="text-text-secondary">
            Los certificados incluyen tu nombre, el curso completado, la fecha y un código de
            credencial, y son verificables públicamente mediante su enlace. No compartas el enlace
            si no quieres que esa información sea visible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Terceros</h2>
          <p className="text-text-secondary">
            Las lecciones se reproducen mediante YouTube, sujeto a las políticas de Google. Nuestra
            infraestructura usa Vercel y Neon (base de datos) y Resend (correos transaccionales).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Tus derechos</h2>
          <p className="text-text-secondary">
            Puedes solicitar la corrección o eliminación de tu cuenta y tus datos escribiéndonos a
            través del <a href="/contact" className="text-accent hover:underline">formulario de contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
