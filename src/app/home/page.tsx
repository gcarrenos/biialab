import Image from "next/image";
import Link from "next/link";
import { courses } from "@/lib/data";
import CourseCard from "@/components/courses/CourseCard";

export default function Home() {
  const featuredCourses = courses.filter(course => course.isFeatured);
  const categories = [...new Set(courses.map(course => course.category))];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-background py-20 sm:py-24 lg:py-32">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background z-10"></div>
          <Image
            src="https://picsum.photos/1920/1080?random=hero" 
            alt="BiiAMind background"
            fill
            priority
            className="object-cover opacity-30"
          />
        </div>
        
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
              Unlock Your Potential with <span className="text-accent">BiiAMind</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-text-secondary">
              Learn from world-class instructors in AI, quantum computing, and cutting-edge technology.
              Master the skills that will shape the future.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/courses"
                className="rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
              >
                Explore Courses
              </Link>
              <Link href="/about" className="text-base font-semibold leading-6 text-text-primary hover:text-accent transition-colors">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Featured Courses</h2>
            <p className="mt-4 text-lg text-text-secondary">
              Our most popular courses, handpicked by our team.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center rounded-md border border-gray-700 px-6 py-3 text-base font-medium text-text-primary hover:bg-background-light transition-colors"
            >
              View All Courses
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-background-light">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Explore by Category
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Discover courses in your field of interest.
            </p>
          </div>
          
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category}
                href={`/courses?category=${encodeURIComponent(category)}`}
                className="group relative flex items-center justify-center h-40 overflow-hidden rounded-lg bg-background"
              >
                <div className="absolute inset-0 bg-black bg-opacity-60 group-hover:bg-opacity-50 transition-opacity"></div>
                <h3 className="relative z-10 text-xl font-bold text-white">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors CTA */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Learn from the Best
            </h2>
            <p className="mt-4 text-lg text-text-secondary">
              Our instructors are world-class experts in their fields.
            </p>
            <div className="mt-10">
              <Link
                href="/about"
                className="rounded-md bg-accent px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
              >
                Meet Our Instructors
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
