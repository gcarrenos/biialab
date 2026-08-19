import Link from 'next/link';
import type { Metadata } from 'next';
import { getTransparencyMetricsSafe } from '@/lib/db/actions/transparency';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Transparencia | BiiALab',
  description:
    'Cifras reales y verificables de BiiALab: cursos publicados, alumnos, exámenes aprobados y certificados emitidos, calculadas en vivo desde nuestra base de datos.',
};

const nf = new Intl.NumberFormat('es-MX');

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  }).format(new Date(iso));
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, 1)),
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5">
      <p className="text-3xl font-bold text-text-primary tabular-nums">{nf.format(value)}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{label}</p>
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}

export default async function TransparenciaPage() {
  const m = await getTransparencyMetricsSafe();
  const maxBar = Math.max(1, ...m.timeline.map((t) => Math.max(t.enrollments, t.certificates)));

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 space-y-14">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Transparencia</h1>
          <p className="text-lg text-text-secondary">
            Estas cifras se calculan en vivo desde nuestra base de datos cada vez que se genera esta
            página. No las escribimos a mano y no las redondeamos hacia arriba. Si un número es
            pequeño, es porque es pequeño.
          </p>
          <p className="text-sm text-text-secondary">
            Última actualización: {fmtDate(m.generatedAt)}. Datos también disponibles en{' '}
            <a href="/api/transparencia" className="text-accent hover:underline">
              formato JSON
            </a>
            .
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Contexto</h2>
          <p className="text-text-secondary">
            Durante 2025 la web de BiiALab estuvo caída, sin cursos disponibles, y el canal de
            YouTube pasó un largo periodo sin publicar. Eso fue cierto y se dijo públicamente. La
            plataforma se relanzó en julio de 2026 con cursos gratuitos, examen final y certificado
            verificable. Esta página existe para que cualquiera pueda comprobar el estado actual sin
            tener que confiar en nuestra palabra.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Plataforma</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Cursos publicados" value={m.courses.published} hint="Todos gratuitos" />
            <Stat label="Lecciones" value={m.courses.lessons} hint="En cursos publicados" />
            <Stat label="Personas registradas" value={m.students.registered} />
            <Stat
              label="Alumnos inscritos"
              value={m.students.enrolled}
              hint={`${nf.format(m.students.enrollments)} inscripciones en total`}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Aprendizaje real</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Lecciones completadas" value={m.students.lessonsCompleted} />
            <Stat label="Exámenes presentados" value={m.exams.attempts} />
            <Stat label="Exámenes aprobados" value={m.exams.passed} hint="Mínimo 70%" />
            <Stat
              label="Certificados emitidos"
              value={m.certificates.issued}
              hint="Cada uno verificable públicamente"
            />
          </div>
        </section>

        {m.timeline.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">Evolución por mes</h2>
            <div className="rounded-xl border border-gray-200 bg-surface p-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary">
                    <th className="pb-2 font-medium">Mes</th>
                    <th className="pb-2 font-medium w-full">Inscripciones</th>
                    <th className="pb-2 font-medium text-right whitespace-nowrap">Certificados</th>
                  </tr>
                </thead>
                <tbody>
                  {m.timeline.map((t) => (
                    <tr key={t.month} className="border-t border-gray-200">
                      <td className="py-2 pr-4 whitespace-nowrap text-text-primary">
                        {fmtMonth(t.month)}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded bg-background-light">
                            <div
                              className="h-2 rounded bg-accent"
                              style={{ width: `${(t.enrollments / maxBar) * 100}%` }}
                            />
                          </div>
                          <span className="tabular-nums text-text-primary w-12 text-right">
                            {nf.format(t.enrollments)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-text-primary">
                        {nf.format(t.certificates)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Cursos publicados</h2>
          {m.courses.list.length === 0 ? (
            <p className="text-text-secondary">No hay cursos publicados en este momento.</p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-surface overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-gray-200">
                    <th className="px-4 py-3 font-medium">Curso</th>
                    <th className="px-4 py-3 font-medium text-right">Lecciones</th>
                    <th className="px-4 py-3 font-medium text-right">Alumnos</th>
                    <th className="px-4 py-3 font-medium text-right">Certificados</th>
                  </tr>
                </thead>
                <tbody>
                  {m.courses.list.map((c) => (
                    <tr key={c.slug} className="border-t border-gray-200">
                      <td className="px-4 py-3">
                        <Link href={`/courses/${c.slug}`} className="text-accent hover:underline">
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{nf.format(c.lessons)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{nf.format(c.students)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {nf.format(c.certificates)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Compruébalo tú mismo</h2>
          <p className="text-text-secondary">
            Cada certificado tiene un código público. Estos son los últimos emitidos; cualquiera
            puede abrirlos y verificar que existen. Los nombres de los alumnos solo aparecen en la
            página de verificación, no aquí.
          </p>
          {m.certificates.recent.length === 0 ? (
            <p className="text-text-secondary">Aún no se ha emitido ningún certificado.</p>
          ) : (
            <ul className="space-y-2">
              {m.certificates.recent.map((c) => (
                <li
                  key={c.code}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-lg border border-gray-200 bg-surface px-4 py-3 text-sm"
                >
                  <Link href={`/verify/${c.code}`} className="font-mono text-accent hover:underline">
                    {c.code}
                  </Link>
                  <span className="text-text-secondary">
                    {c.course} · {fmtDate(c.issuedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Cómo funciona el modelo</h2>
          <ul className="list-disc pl-5 space-y-2 text-text-secondary">
            <li>Todos los cursos y todos los exámenes son gratuitos, sin tarjeta ni prueba.</li>
            <li>
              El certificado digital verificable tiene un costo único opcional que cubre su emisión;
              el aprendizaje nunca está detrás de un pago.
            </li>
            <li>No vendemos datos de alumnos ni usamos testimonios inventados.</li>
            <li>
              Si encuentras un dato en esta página o en cualquier parte del sitio que no puedas
              verificar,{' '}
              <Link href="/contact" className="text-accent hover:underline">
                escríbenos
              </Link>{' '}
              y lo corregimos o lo retiramos.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
