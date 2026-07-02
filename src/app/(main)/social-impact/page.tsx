import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impacto Social | BiiALab',
  description:
    'Creemos que la educación en inteligencia artificial y tecnología debe estar al alcance de toda Latinoamérica. Conoce nuestra visión de impacto social y proyectos de tecnología de interés público.',
};

export default function SocialImpactPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-light to-background overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
            Tecnología y educación al servicio de nuestra comunidad
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            La inteligencia artificial está transformando la economía global.
            Nuestra misión es que Latinoamérica no se quede mirando: que
            cualquier persona, sin importar dónde nació o cuánto puede pagar,
            tenga acceso a formación tecnológica de clase mundial en español.
          </p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-12 text-center">
            Nuestros pilares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background-light p-8 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl text-text-primary font-medium mb-2">
                Educación en español
              </h3>
              <p className="text-text-secondary">
                El mejor contenido sobre IA y tecnología está casi siempre en
                inglés. Producimos formación de vanguardia en nuestro idioma,
                para cerrar esa brecha antes de que se vuelva un abismo.
              </p>
            </div>

            <div className="bg-background-light p-8 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl text-text-primary font-medium mb-2">
                Acceso sin barreras
              </h3>
              <p className="text-text-secondary">
                El talento está distribuido por igual; las oportunidades no.
                Trabajamos para que el costo y la geografía dejen de decidir
                quién puede aprender a construir con tecnología.
              </p>
            </div>

            <div className="bg-background-light p-8 rounded-lg border border-gray-200 shadow-sm">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl text-text-primary font-medium mb-2">
                Tecnología de interés público
              </h3>
              <p className="text-text-secondary">
                Enseñamos construyendo. Aplicamos IA a problemas reales que
                afectan a nuestra gente — salud, acceso a la información,
                oportunidad económica — y documentamos lo aprendido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study: PlanVoyager */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background-light border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="bg-background p-8 md:p-12 rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent mb-4">
              Caso de estudio
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              IA de interés público: PlanVoyager
            </h2>
            <p className="text-text-secondary mb-6">
              Tecnología con impacto social en la práctica: cómo se construyó una
              herramienta gratuita que usa IA para ayudar a las familias en EE.UU.
              — incluida la comunidad hispana — a comparar planes de salud y
              calcular sus subsidios con datos oficiales.
            </p>
            <Link
              href="/casos/planvoyager"
              className="inline-flex items-center px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
            >
              Leer el caso de estudio
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Partner CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="bg-background-light p-8 rounded-lg border border-gray-200 shadow-sm max-w-4xl mx-auto">
            <div className="flex items-start">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-6 flex-shrink-0">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl text-text-primary font-medium mb-2">
                  ¿Trabajas en una organización con misión social?
                </h3>
                <p className="text-text-secondary mb-4">
                  Si tu organización apoya la educación o el desarrollo
                  profesional en Latinoamérica y quieres explorar una
                  colaboración, nos encantaría escucharte.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
                >
                  Conversemos
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
