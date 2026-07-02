import Image from 'next/image';
import Link from 'next/link';
import { Course } from '@/lib/types';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg bg-background-light shadow-lg transition-all hover:shadow-xl">
      <Link href={`/courses/${course.id}`} className="absolute inset-0 z-10" aria-label={course.title}></Link>

      <div className="relative overflow-hidden aspect-video">
        <Image
          src={course.thumbnail || "https://picsum.photos/800/450?random=placeholder"}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        {course.isFeatured && (
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 text-xs font-semibold rounded z-20">
            Destacado
          </div>
        )}
        <p className="absolute bottom-2 left-3 font-bold text-white text-sm drop-shadow">
          {course.instructor.name}
        </p>
      </div>

      <div className="flex flex-col flex-grow p-5">
        <p className="text-xs text-accent mb-1">{course.category}</p>
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
          {course.title}
        </h3>

        <p className="mt-3 text-sm text-text-secondary line-clamp-2">
          {course.description}
        </p>

        <div className="mt-4 pt-4 border-t border-gray-800/60 grid grid-cols-3 text-xs text-text-secondary">
          <div className="flex flex-col">
            <span className="text-text-secondary/70">Duración</span>
            <span>{course.duration}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-secondary/70">Nivel</span>
            <span>{course.level}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-text-secondary/70">Lecciones</span>
            <span>{course.lessons}</span>
          </div>
        </div>
      </div>
    </div>
  );
}