'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getAllCourses, deleteCourse, CourseWithDetails } from '@/lib/db/actions/courses';

export default function CoursesAdmin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [certTestStatus, setCertTestStatus] = useState<'idle' | 'running' | 'error'>('idle');

  const handleTestCertificate = async () => {
    setCertTestStatus('running');
    try {
      const password = sessionStorage.getItem('biialab_admin_auth');
      const res = await fetch('/api/admin/test-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, courseSlug: filteredCourses[0]?.slug }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.open(data.url, '_blank', 'noopener');
        setCertTestStatus('idle');
      } else {
        setCertTestStatus('error');
      }
    } catch {
      setCertTestStatus('error');
    }
  };

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDelete = async (course: CourseWithDetails) => {
    if (!confirm(`¿Eliminar "${course.title}" y todas sus lecciones?`)) return;
    const adminPassword = sessionStorage.getItem('biialab_admin_auth') ?? undefined;
    const result = await deleteCourse(course.id, adminPassword);
    if (result.success) {
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } else {
      alert(`Error eliminando el curso: ${result.error}`);
    }
  };

  const handleMigrate = async () => {
    setMigrateStatus('running');
    try {
      const password = sessionStorage.getItem('biialab_admin_auth');
      const res = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      setMigrateStatus(data.success ? 'done' : 'error');
      if (data.success) fetchCourses();
    } catch {
      setMigrateStatus('error');
    }
  };

  const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchTerm === '' ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === '' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-primary">Courses</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestCertificate}
            disabled={certTestStatus === 'running'}
            title="Emite un certificado de prueba para el primer curso filtrado y abre su página de verificación con el botón de LinkedIn"
            className="px-4 py-2 border border-gray-300 text-text-primary rounded-md text-sm font-medium hover:border-accent hover:text-accent transition-colors disabled:opacity-50"
          >
            {certTestStatus === 'running' ? 'Generando…' : certTestStatus === 'error' ? 'Error — reintentar' : 'Probar certificado (LinkedIn)'}
          </button>
          <Link
            href="/admin/youtube"
            className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Importar desde YouTube
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-background-light p-6 rounded-lg border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-text-secondary mb-2">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              placeholder="Título o descripción…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="sm:w-1/3">
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary mb-2">
              Categoría
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-background-light rounded-lg border border-gray-800 p-10 text-center space-y-4">
          <h3 className="text-xl font-medium text-text-primary">Aún no hay cursos en la base de datos</h3>
          <p className="text-text-secondary max-w-lg mx-auto">
            Importa tus primeros cursos desde YouTube. Si es la primera vez, ejecuta antes la
            migración para crear las tablas.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleMigrate}
              disabled={migrateStatus === 'running'}
              className="px-4 py-2 bg-background border border-gray-700 text-text-primary rounded-md text-sm hover:border-accent transition-colors disabled:opacity-50"
            >
              {migrateStatus === 'running' ? 'Migrando…' : migrateStatus === 'done' ? '✓ Tablas listas' : '1. Crear tablas (migración)'}
            </button>
            <Link
              href="/admin/youtube"
              className="px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
            >
              2. Importar desde YouTube
            </Link>
          </div>
          {migrateStatus === 'error' && (
            <p className="text-red-400 text-sm">La migración falló. Revisa los logs del servidor.</p>
          )}
        </div>
      ) : (
        <div className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 bg-background-light p-4 border-b border-gray-800 text-sm font-medium">
            <div className="col-span-4">Curso</div>
            <div className="col-span-2">Categoría</div>
            <div className="col-span-2">Instructor</div>
            <div className="col-span-1">Nivel</div>
            <div className="col-span-1">Lecciones</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <div className="divide-y divide-gray-800">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div key={course.id} className="grid grid-cols-12 p-4 items-center hover:bg-background transition-colors text-sm">
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-900">
                        {course.thumbnail && (
                          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{course.title}</p>
                        <p className="text-xs text-text-secondary truncate max-w-xs">
                          {(course.shortDescription ?? course.description ?? '').slice(0, 60)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2 py-1 bg-background rounded-full text-xs font-medium text-text-primary">
                      {course.category ?? '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-text-primary text-xs">{course.instructor?.name ?? '—'}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-text-secondary">{course.level ?? '—'}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-text-secondary">
                      {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        className="p-1.5 bg-background hover:bg-accent/10 rounded text-text-secondary hover:text-accent transition-colors"
                        title="Ver curso"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <button
                        className="p-1.5 bg-background hover:bg-red-900/10 rounded text-text-secondary hover:text-red-500 transition-colors"
                        onClick={() => handleDelete(course)}
                        title="Eliminar curso"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary">
                No hay cursos que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
