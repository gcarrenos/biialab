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
      
      <div className="relative overflow-hidden h-48">
        <Image 
          src={course.thumbnail || "https://picsum.photos/800/450?random=placeholder"} 
          alt={course.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        {course.isFeatured && (
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 text-xs font-semibold rounded z-20">
            Featured
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow p-5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-xs text-text-secondary mb-1">{course.category}</p>
            <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent transition-colors line-clamp-2">
              {course.title}
            </h3>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-text-secondary line-clamp-2">
          {course.description}
        </p>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
            <Image 
              src={course.instructor.avatar || "https://picsum.photos/200/200?random=instructor"} 
              alt={course.instructor.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-primary">{course.instructor.name}</span>
            <span className="text-xs text-text-secondary">{course.instructor.title}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 text-xs text-text-secondary">
          <div className="flex flex-col">
            <span className="font-medium">Duration</span>
            <span>{course.duration}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Level</span>
            <span>{course.level}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">Lessons</span>
            <span>{course.lessons}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 