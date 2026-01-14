'use server';

import { db } from '@/lib/db';
import { courses, modules, lessons, instructors, youtubeVideos } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface CourseWithDetails {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnail: string | null;
  category: string | null;
  level: string | null;
  duration: string | null;
  totalLessons: number | null;
  status: string | null;
  isFeatured: boolean | null;
  instructor: {
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    avatar: string | null;
  } | null;
  modules: {
    id: string;
    title: string;
    sortOrder: number | null;
    lessons: {
      id: string;
      title: string;
      description: string | null;
      videoUrl: string | null;
      duration: string | null;
      youtubeVideoId: string | null;
      sortOrder: number | null;
      isFree: boolean | null;
      isLocked: boolean | null;
    }[];
  }[];
}

// Get all published courses
export async function getAllCourses(): Promise<CourseWithDetails[]> {
  const coursesData = await db
    .select()
    .from(courses)
    .where(eq(courses.status, 'published'))
    .orderBy(desc(courses.createdAt));

  const coursesWithDetails: CourseWithDetails[] = [];

  for (const course of coursesData) {
    // Get instructor
    let instructor = null;
    if (course.instructorId) {
      const [instructorData] = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, course.instructorId));
      if (instructorData) {
        instructor = {
          id: instructorData.id,
          name: instructorData.name,
          title: instructorData.title,
          bio: instructorData.bio,
          avatar: instructorData.avatar,
        };
      }
    }

    // Get modules with lessons
    const modulesData = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(modules.sortOrder);

    const modulesWithLessons = [];
    for (const mod of modulesData) {
      const lessonsData = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, mod.id))
        .orderBy(lessons.sortOrder);

      modulesWithLessons.push({
        id: mod.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
        lessons: lessonsData.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          youtubeVideoId: lesson.youtubeVideoId,
          sortOrder: lesson.sortOrder,
          isFree: lesson.isFree,
          isLocked: lesson.isLocked,
        })),
      });
    }

    coursesWithDetails.push({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      duration: course.duration,
      totalLessons: course.totalLessons,
      status: course.status,
      isFeatured: course.isFeatured,
      instructor,
      modules: modulesWithLessons,
    });
  }

  return coursesWithDetails;
}

// Get a single course by slug or ID (returns any status - draft or published)
export async function getCourseBySlugOrId(slugOrId: string): Promise<CourseWithDetails | null> {
  // Try to find by slug first, then by ID
  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, slugOrId));

  if (!course) {
    // Try by ID (UUID)
    try {
      [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, slugOrId));
    } catch {
      // Invalid UUID format, skip
    }
  }

  if (!course) {
    return null;
  }

  // Get instructor
  let instructor = null;
  if (course.instructorId) {
    const [instructorData] = await db
      .select()
      .from(instructors)
      .where(eq(instructors.id, course.instructorId));
    if (instructorData) {
      instructor = {
        id: instructorData.id,
        name: instructorData.name,
        title: instructorData.title,
        bio: instructorData.bio,
        avatar: instructorData.avatar,
      };
    }
  }

  // Get modules with lessons
  const modulesData = await db
    .select()
    .from(modules)
    .where(eq(modules.courseId, course.id))
    .orderBy(modules.sortOrder);

  const modulesWithLessons = [];
  for (const mod of modulesData) {
    const lessonsData = await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, mod.id))
      .orderBy(lessons.sortOrder);

    modulesWithLessons.push({
      id: mod.id,
      title: mod.title,
      sortOrder: mod.sortOrder,
      lessons: lessonsData.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        youtubeVideoId: lesson.youtubeVideoId,
        sortOrder: lesson.sortOrder,
        isFree: lesson.isFree,
        isLocked: lesson.isLocked,
      })),
    });
  }

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    shortDescription: course.shortDescription,
    thumbnail: course.thumbnail,
    category: course.category,
    level: course.level,
    duration: course.duration,
    totalLessons: course.totalLessons,
    status: course.status,
    isFeatured: course.isFeatured,
    instructor,
    modules: modulesWithLessons,
  };
}

// Get YouTube video details for a lesson
export async function getYouTubeVideoForLesson(youtubeVideoId: string) {
  const [video] = await db
    .select()
    .from(youtubeVideos)
    .where(eq(youtubeVideos.id, youtubeVideoId));
  
  return video || null;
}

// Publish all draft courses
export async function publishAllDraftCourses(): Promise<number> {
  const result = await db
    .update(courses)
    .set({ 
      status: 'published',
      publishedAt: new Date(),
    })
    .where(eq(courses.status, 'draft'));
  
  return result.rowCount || 0;
}

// Get all courses (including drafts) for admin
export async function getAllCoursesAdmin(): Promise<CourseWithDetails[]> {
  const coursesData = await db
    .select()
    .from(courses)
    .orderBy(desc(courses.createdAt));

  const coursesWithDetails: CourseWithDetails[] = [];

  for (const course of coursesData) {
    // Get instructor
    let instructor = null;
    if (course.instructorId) {
      const [instructorData] = await db
        .select()
        .from(instructors)
        .where(eq(instructors.id, course.instructorId));
      if (instructorData) {
        instructor = {
          id: instructorData.id,
          name: instructorData.name,
          title: instructorData.title,
          bio: instructorData.bio,
          avatar: instructorData.avatar,
        };
      }
    }

    // Get modules with lessons
    const modulesData = await db
      .select()
      .from(modules)
      .where(eq(modules.courseId, course.id))
      .orderBy(modules.sortOrder);

    const modulesWithLessons = [];
    for (const mod of modulesData) {
      const lessonsData = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, mod.id))
        .orderBy(lessons.sortOrder);

      modulesWithLessons.push({
        id: mod.id,
        title: mod.title,
        sortOrder: mod.sortOrder,
        lessons: lessonsData.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          youtubeVideoId: lesson.youtubeVideoId,
          sortOrder: lesson.sortOrder,
          isFree: lesson.isFree,
          isLocked: lesson.isLocked,
        })),
      });
    }

    coursesWithDetails.push({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level,
      duration: course.duration,
      totalLessons: course.totalLessons,
      status: course.status,
      isFeatured: course.isFeatured,
      instructor,
      modules: modulesWithLessons,
    });
  }

  return coursesWithDetails;
}
