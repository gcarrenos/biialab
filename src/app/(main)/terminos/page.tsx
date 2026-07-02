import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de uso | BiiALab',
  description: 'Condiciones de uso de la plataforma educativa BiiALab.',
};

export default function TerminosPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Términos de uso</h1>
          <p className="text-text-secondary text-sm">Última actualización: julio de 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">El servicio</h2>
          <p className="text-text-secondary">
            BiiALab es una plataforma educativa gratuita. Las lecciones son videos publicados en
            YouTube que se reproducen dentro de la plataforma acreditando a sus creadores. Los
            cursos, exámenes y certificados se ofrecen tal cual, sin garantías de disponibilidad
            permanente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Tu cuenta</h2>
          <p className="text-text-secondary">
            Eres responsable de la exactitud de tus datos y de mantener tu contraseña segura. El
            nombre de tu cuenta aparecerá en tus certificados. Podemos suspender cuentas que
            abusen del servicio (automatización, suplantación o fraude en los exámenes).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Certificados</h2>
          <p className="text-text-secondary">
            Los certificados acreditan la aprobación del examen final de un curso de BiiALab. No
            constituyen títulos académicos oficiales ni certificaciones profesionales reguladas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Propiedad intelectual</h2>
          <p className="text-text-secondary">
            El contenido de los videos pertenece a sus creadores. La marca BiiALab, el diseño de la
            plataforma y los exámenes son propiedad de BiiA LAB. No está permitido copiar o
            redistribuir los exámenes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">Contacto</h2>
          <p className="text-text-secondary">
            Para cualquier consulta sobre estos términos, escríbenos por el{' '}
            <a href="/contact" className="text-accent hover:underline">formulario de contacto</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
