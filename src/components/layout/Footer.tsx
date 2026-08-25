import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

export default function Footer() {
  return (
    <footer className="bg-[#17181c] text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Logo onDark />
            <p className="text-sm leading-6">
              Educación en inteligencia artificial y tecnología de vanguardia,
              en español, para toda Latinoamérica.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-6 text-white">Explora</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li>
                <Link href="/courses" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/social-impact" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Impacto social
                </Link>
              </li>
              <li>
                <Link href="/casos/planvoyager" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Caso de estudio: PlanVoyager
                </Link>
              </li>
              <li>
                <Link href="/transparencia" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Transparencia
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-6 text-white">Contacto</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li>
                <Link href="/contact" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Escríbenos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="text-xs leading-5 text-gray-500">
            &copy; {new Date().getFullYear()} BiiALab. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
