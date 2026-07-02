import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-background-light text-text-secondary mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">
              BiiA<span className="text-accent">Lab</span>
            </h2>
            <p className="text-sm leading-6">
              Educación en inteligencia artificial y tecnología de vanguardia,
              en español, para toda Latinoamérica.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-6 text-text-primary">Explora</h3>
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
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold leading-6 text-text-primary">Contacto</h3>
            <ul role="list" className="mt-6 space-y-4">
              <li>
                <Link href="/contact" className="text-sm leading-6 text-gray-400 hover:text-accent">
                  Escríbenos
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8">
          <p className="text-xs leading-5 text-gray-400">
            &copy; {new Date().getFullYear()} BiiALab. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
