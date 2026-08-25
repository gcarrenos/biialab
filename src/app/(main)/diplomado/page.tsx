import type { Metadata } from 'next';
import Link from 'next/link';
import { IconCheck } from '@/components/icons';
import { BuyDiplomadoButton } from '@/components/diplomado/BuyDiplomadoButton';
import { diplomadoEnabled, diplomadoPriceUsd } from '@/lib/payments/stripe';

export const metadata: Metadata = {
  title: 'Diplomado en Neuroventas | BiiA LAB',
  description:
    'El programa completo de neuroventas de BiiA LAB: los cursos, el examen final y un certificado premium verificable. Precio de fundador por tiempo limitado.',
};

const INCLUDES = [
  'Los 4 cursos del programa: Persuasión y neuromarketing, Ventas que funcionan, Marketing y ventas digitales, y Emprender con estrategia',
  'Examen final integrador del diplomado',
  'Certificado premium del Diplomado, verificable públicamente y listo para LinkedIn',
  'Acceso de por vida al contenido del programa',
  'Basado en las conferencias de BiiA LAB vistas por millones de personas',
];

export default async function DiplomadoPage({
  searchParams,
}: {
  searchParams: Promise<{ gracias?: string }>;
}) {
  const { gracias } = await searchParams;
  const enabled = diplomadoEnabled();
  const price = diplomadoPriceUsd();

  if (gracias) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <IconCheck className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Tu lugar está reservado</h1>
        <p className="text-text-secondary text-lg">
          Gracias por unirte como fundador al Diplomado en Neuroventas. El programa abre el
          1 de septiembre de 2026 — te escribiremos al correo que usaste en el pago con tu
          acceso y los siguientes pasos.
        </p>
        <p className="text-text-secondary">
          Mientras tanto, puedes empezar hoy con los cursos gratuitos.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
        >
          Ver los cursos gratuitos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-4">
        <p className="text-accent font-semibold uppercase tracking-wide text-sm">
          Preventa — precio de fundador
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
          Diplomado en Neuroventas
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          El programa completo de BiiA LAB para dominar cómo decide el cerebro de tus
          clientes — y venderle a la mente, no a la gente.
        </p>
      </div>

      <div className="bg-surface border border-gray-200 rounded-2xl p-8 space-y-6">
        <h2 className="text-xl font-semibold text-text-primary">Qué incluye</h2>
        <ul className="space-y-3">
          {INCLUDES.map((item) => (
            <li key={item} className="flex gap-3 text-text-secondary">
              <IconCheck className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-gray-200 pt-6 text-center space-y-4">
          <div>
            <span className="text-4xl font-bold text-text-primary">USD ${price}</span>
            <span className="text-text-secondary ml-2 line-through">$79</span>
          </div>
          <p className="text-text-secondary text-sm">
            El programa abre el 1 de septiembre de 2026. Al reservar hoy aseguras el precio
            de fundador y tu acceso desde el primer día.
          </p>
          {enabled ? (
            <BuyDiplomadoButton priceUsd={price} />
          ) : (
            <p className="text-text-secondary">La preventa abre muy pronto.</p>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-text-secondary space-y-2">
        <p>
          Los cursos individuales de BiiA LAB siguen siendo gratuitos — el Diplomado es el
          programa integrado, con examen final y certificado premium.
        </p>
        <p>
          Preguntas: escríbenos desde la página de <Link href="/social-impact" className="text-accent hover:underline">contacto</Link>.
        </p>
      </div>
    </div>
  );
}
