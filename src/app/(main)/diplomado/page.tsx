import type { Metadata } from 'next';
import Link from 'next/link';
import { IconCheck } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Diplomado en Neuroventas | BiiA LAB',
  description:
    'El programa completo de neuroventas de BiiA LAB: 27 clases, examen final integrador y un certificado premium verificable. El contenido es gratis; el certificado cuesta USD $49.',
};

// The Diplomado is a real course on the platform (slug below): 27 lessons drawn
// from the four sales courses, plus an integrating final exam. Content is free
// like every other course; the $49 buys the verified premium certificate, which
// is issued on passing and unlocked through the normal certificate checkout.
const COURSE_SLUG = 'diplomado-en-neuroventas';
const CERTIFICATE_PRICE_USD = 49;

const AREAS = [
  { name: 'Persuasión y neuromarketing', lessons: 5, detail: 'Cómo decide el cerebro del cliente, escritura persuasiva, método AIDA y negociación.' },
  { name: 'Ventas que funcionan', lessons: 12, detail: 'El ciclo completo: prospección, confianza, objeciones y cierre, con Jorge Martínez y Jürgen Klarić.' },
  { name: 'Marketing y ventas digitales', lessons: 7, detail: 'Plan de marketing, contenido que convierte y cómo sistematizar el negocio.' },
  { name: 'Emprender con estrategia', lessons: 3, detail: 'Aceleración comercial y cómo llevar una idea a un negocio que funciona.' },
];

export default function DiplomadoPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-4">
        <p className="text-accent font-semibold uppercase tracking-wide text-sm">
          Programa abierto — empieza cuando quieras
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
          Diplomado en Neuroventas
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          El programa completo de BiiA LAB para dominar cómo decide el cerebro de tus
          clientes — y venderle a la mente, no a la gente.
        </p>
        <p className="text-text-secondary">
          27 clases · 27 horas · examen final integrador
        </p>
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Las cuatro áreas del programa</h2>
        <ul className="space-y-4">
          {AREAS.map((area) => (
            <li key={area.name} className="flex gap-3">
              <IconCheck className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
              <span>
                <span className="block font-semibold text-text-primary">
                  {area.name}
                  <span className="ml-2 font-normal text-text-secondary text-sm">
                    {area.lessons} clases
                  </span>
                </span>
                <span className="block text-text-secondary text-sm">{area.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t border-gray-200 pt-6 text-center space-y-4">
          <p className="text-text-primary font-semibold text-lg">
            El contenido es gratuito, como todos los cursos de BiiA LAB.
          </p>
          <p className="text-text-secondary">
            Ves las 27 clases y presentas el examen sin pagar nada. Si lo apruebas, puedes
            activar tu <strong className="text-text-primary">certificado premium del Diplomado</strong>{' '}
            por USD ${CERTIFICATE_PRICE_USD}: verificable públicamente y listo para LinkedIn.
          </p>
          <Link
            href={`/courses/${COURSE_SLUG}`}
            className="inline-block px-8 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
          >
            Empezar el Diplomado
          </Link>
          <p className="text-text-secondary text-sm">
            Sin tarjeta, sin suscripción. Solo pagas si quieres el diploma.
          </p>
        </div>
      </div>

      <div className="text-center text-sm text-text-secondary space-y-2">
        <p>
          Los cursos individuales siguen siendo gratuitos — el Diplomado es el programa
          integrado, con examen final y certificado premium.
        </p>
        <p>
          Preguntas: escríbenos desde la página de{' '}
          <Link href="/social-impact" className="text-accent hover:underline">contacto</Link>.
        </p>
      </div>
    </div>
  );
}
