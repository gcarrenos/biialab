'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CategoryTabs, ALL_CATEGORY } from '@/components/home/CategoryTabs';
import { IconCheck, IconChevronRight } from '@/components/icons';

export interface GridCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  thumbnail: string | null;
  category: string | null;
  level: string | null;
  lessonCount: number;
  instructorName: string | null;
}

function InstructorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  // Deterministic color from the name so avatars stay stable across renders.
  const hue = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

/** All BiiALab courses are curated in-house, so every instructor gets the
 * verified badge: an accent-filled circle with a white check mark. */
function VerifiedBadge() {
  return (
    <span
      className="flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white flex-shrink-0"
      aria-label="Curso verificado"
    >
      <IconCheck size={10} />
    </span>
  );
}

function CourseCard({ course }: { course: GridCourse }) {
  const instructorName = course.instructorName ?? 'BiiALab';
  const tags = [course.category, course.level].filter((t): t is string => Boolean(t)).slice(0, 2);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-surface border border-gray-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className="relative aspect-video overflow-hidden bg-background-light">
        {course.thumbnail && (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>
      <div className="flex flex-col flex-grow p-4">
        <div className="flex items-center gap-2 mb-2">
          <InstructorAvatar name={instructorName} />
          <h3 className="flex-1 min-w-0 text-sm font-bold text-text-primary line-clamp-1">
            {course.title}
          </h3>
          <VerifiedBadge />
        </div>
        <p className="text-sm text-text-secondary line-clamp-1 mb-3">
          {course.shortDescription ?? 'Curso de BiiALab.'}
        </p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-background-light text-text-secondary text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between text-xs text-text-secondary">
          <span>
            {course.lessonCount} {course.lessonCount === 1 ? 'lección' : 'lecciones'}
          </span>
          <span className="font-bold text-accent">Gratis</span>
        </div>
      </div>
    </Link>
  );
}

interface CourseGridProps {
  courses: GridCourse[];
  /** How many cards to show before the "Ver todos" button appears. */
  limit?: number;
}

export function CourseGrid({ courses, limit = 12 }: CourseGridProps) {
  const [active, setActive] = useState<string>(ALL_CATEGORY);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) {
      if (c.category) set.add(c.category);
    }
    return Array.from(set).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    if (active === ALL_CATEGORY) return courses;
    return courses.filter((c) => (c.category ?? 'Otros cursos') === active);
  }, [courses, active]);

  const visible = filtered.slice(0, limit);

  return (
    <div>
      <CategoryTabs categories={categories} active={active} onChange={setActive} />

      {visible.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center py-16 text-text-secondary">
          No hay cursos en esta categoría todavía.
        </div>
      )}

      {filtered.length > limit && (
        <div className="mt-10 text-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full border border-gray-300 text-text-primary font-semibold hover:border-accent hover:text-accent transition-colors"
          >
            Ver todos los cursos
            <IconChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
