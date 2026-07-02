import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Caso de estudio: PlanVoyager — IA aplicada al seguro médico en EE.UU. | BiiALab',
  description:
    'Cómo se construyó PlanVoyager, una herramienta gratuita de interés público que usa IA para ayudar a comparar planes de salud ACA y calcular subsidios en Estados Unidos. Arquitectura, principios de diseño y lecciones para builders.',
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline:
    'Caso de estudio: PlanVoyager — IA aplicada al seguro médico en EE.UU.',
  author: {
    '@type': 'Person',
    name: 'Gustavo Carreño',
  },
  publisher: {
    '@type': 'Organization',
    name: 'BiiALab',
    url: 'https://biialab.org',
  },
  inLanguage: 'es',
  about: ['inteligencia artificial', 'seguro médico', 'ACA', 'salud pública'],
};

export default function PlanVoyagerCaseStudyPage() {
  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      {/* Hero */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background-light to-background overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent mb-6">
            Caso de estudio
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
            PlanVoyager: IA de interés público para el seguro médico en EE.UU.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto">
            Cómo un solo desarrollador convirtió 3,7 millones de registros
            públicos del gobierno estadounidense en una herramienta gratuita
            que ayuda a las familias — incluida la comunidad hispana — a
            entender y elegir su seguro médico.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
            <div className="text-4xl font-bold text-accent mb-2">4.000+</div>
            <div className="text-text-secondary">planes de salud analizados</div>
          </div>
          <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
            <div className="text-4xl font-bold text-accent mb-2">30</div>
            <div className="text-text-secondary">estados cubiertos</div>
          </div>
          <div className="bg-background-light p-8 rounded-lg border border-gray-800 text-center">
            <div className="text-4xl font-bold text-accent mb-2">3,7M</div>
            <div className="text-text-secondary">registros oficiales procesados</div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              El problema: un sistema que nadie entiende
            </h2>
            <p className="text-text-secondary mb-4">
              En Estados Unidos, elegir un plan de salud del mercado ACA
              (&ldquo;Obamacare&rdquo;) implica comparar deducibles, copagos,
              redes de proveedores y subsidios fiscales calculados con tablas
              del IRS. La complejidad tiene un costo real: millones de personas
              — con frecuencia trabajadores independientes y familias
              hispanohablantes — terminan en planes que no se ajustan a sus
              necesidades, o renuncian a subsidios que les corresponden.
            </p>
            <p className="text-text-secondary">
              <a
                href="https://planvoyager.com"
                className="text-accent hover:underline"
              >
                PlanVoyager
              </a>{' '}
              nació como una iniciativa de tecnología de interés público:
              una herramienta gratuita, sin publicidad y sin venta de datos,
              que usa IA para traducir esa complejidad a lenguaje claro.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              El principio de diseño: la IA explica, nunca calcula
            </h2>
            <p className="text-text-secondary mb-4">
              La decisión de arquitectura más importante del proyecto — y la
              lección más valiosa para quienes construyen con LLMs — es la
              separación estricta entre cálculo y explicación:
            </p>
            <ul className="text-text-secondary space-y-3 list-disc pl-6 mb-4">
              <li>
                <strong className="text-text-primary">Los números son deterministas.</strong>{' '}
                Los subsidios se calculan con las tablas oficiales del IRS y las
                guías federales de pobreza (FPL): matemática auditable, sin
                modelos de por medio.
              </li>
              <li>
                <strong className="text-text-primary">La IA solo explica.</strong>{' '}
                Los modelos de lenguaje traducen terminología de seguros a
                lenguaje cotidiano, pero jamás generan una cifra ni una
                determinación de elegibilidad.
              </li>
            </ul>
            <p className="text-text-secondary">
              En dominios regulados (salud, finanzas, legal), este patrón —
              deterministic core, generative edge — elimina el riesgo de
              alucinaciones justo donde el error cuesta más.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              La arquitectura
            </h2>
            <ul className="text-text-secondary space-y-3 list-disc pl-6">
              <li>
                <strong className="text-text-primary">Datos:</strong> los
                Public Use Files de CMS (la misma fuente de HealthCare.gov) —
                3,7 millones de registros de planes, primas, beneficios y redes
                — ingeridos a MongoDB con pipelines de validación propios.
              </li>
              <li>
                <strong className="text-text-primary">Aplicación:</strong>{' '}
                Next.js 15 (App Router) con generación estática incremental
                para ~4.000 páginas de planes, desplegada en Vercel.
              </li>
              <li>
                <strong className="text-text-primary">Capa de IA:</strong>{' '}
                LLMs para explicaciones de planes y simulación de escenarios
                médicos, con la restricción de solo-explicar descrita arriba.
              </li>
              <li>
                <strong className="text-text-primary">Transparencia:</strong>{' '}
                metodología documentada públicamente y un{' '}
                <a
                  href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5934035"
                  className="text-accent hover:underline"
                  rel="noopener"
                >
                  paper académico en SSRN
                </a>{' '}
                sobre IA y accesibilidad del sistema de salud.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Resultados y datos abiertos
            </h2>
            <p className="text-text-secondary mb-4">
              El proyecto publica investigación con sus propios datos, como el{' '}
              <a
                href="https://planvoyager.com/research/aca-marketplace-premiums-by-state"
                className="text-accent hover:underline"
              >
                estudio de primas del mercado ACA por estado
              </a>
              , que compara el costo del plan más económico en cada uno de los
              30 estados cubiertos — de los $278/mes en New Hampshire a los
              $740/mes en Wyoming — con cifras libres para citar con
              atribución.
            </p>
            <p className="text-text-secondary">
              Para la comunidad hispana en EE.UU. — uno de los grupos con
              mayor tasa de no-asegurados del país — herramientas gratuitas y
              neutrales de este tipo reducen una barrera de información que
              históricamente ha requerido pagar a un intermediario.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Lecciones para builders
            </h2>
            <ul className="text-text-secondary space-y-3 list-disc pl-6">
              <li>
                Los datos públicos son una ventaja competitiva ignorada: el
                dataset completo de CMS está disponible para cualquiera; casi
                nadie lo usa bien.
              </li>
              <li>
                En dominios sensibles, restringir dónde puede actuar la IA
                genera más confianza que maximizar dónde actúa.
              </li>
              <li>
                Un proyecto de interés público también es un laboratorio de
                ingeniería: SEO programático (miles de páginas), pipelines de
                datos, evaluación de LLMs y optimización de rendimiento web,
                todo en producción real.
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-background-light p-8 rounded-lg border border-gray-800">
            <h3 className="text-xl text-text-primary font-medium mb-2">
              Explora el proyecto
            </h3>
            <p className="text-text-secondary mb-4">
              PlanVoyager es gratuito y de interés público. Si estudias IA
              aplicada, es un ejemplo de producción real de principio a fin.
            </p>
            <a
              href="https://planvoyager.com"
              className="inline-flex items-center px-4 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
            >
              Visitar PlanVoyager
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
