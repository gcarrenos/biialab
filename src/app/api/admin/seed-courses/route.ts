import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { courses, modules, lessons, instructors, youtubeVideos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import seedData from '@/lib/db/seed/ai-courses.json';

export const maxDuration = 60;

interface SeedLesson {
  youtubeVideoId: string;
  title: string;
  channel: string;
}

interface SeedCourse {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  level: string;
  instructorName: string;
  instructorTitle: string;
  thumbnail: string;
  lessons: SeedLesson[];
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Seeds the curated AI course catalog (src/lib/db/seed/ai-courses.json).
// Idempotent: courses whose slug already exists are skipped, so re-running
// never duplicates and never overwrites admin edits.
export async function POST(request: Request) {
  try {
    const { password, featuredCount = 6 } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const courseSeeds = (seedData as { courses: SeedCourse[] }).courses;
    const results: { title: string; status: 'created' | 'skipped' | 'failed'; error?: string }[] = [];
    let createdCount = 0;

    for (const seed of courseSeeds) {
      const slug = slugify(seed.title);
      try {
        const existing = await db.query.courses.findFirst({ where: eq(courses.slug, slug) });
        if (existing) {
          results.push({ title: seed.title, status: 'skipped' });
          continue;
        }

        // Instructor: find-or-create by name (channel attribution)
        let instructorId: string;
        const existingInstructor = await db.query.instructors.findFirst({
          where: eq(instructors.name, seed.instructorName),
        });
        if (existingInstructor) {
          instructorId = existingInstructor.id;
        } else {
          const [newInstructor] = await db.insert(instructors).values({
            name: seed.instructorName,
            title: seed.instructorTitle,
            bio: `Contenido publicado originalmente en el canal de YouTube "${seed.instructorName}". Las lecciones se reproducen desde YouTube, acreditando a su creador.`,
          }).returning();
          instructorId = newInstructor.id;
        }

        // YouTube video rows first (lessons FK-reference them)
        for (const lesson of seed.lessons) {
          await db.insert(youtubeVideos).values({
            id: lesson.youtubeVideoId,
            title: lesson.title,
            channelTitle: lesson.channel,
            thumbnailHigh: `https://i.ytimg.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg`,
            isActive: true,
          }).onConflictDoNothing();
        }

        const [course] = await db.insert(courses).values({
          slug,
          title: seed.title,
          description: seed.description,
          shortDescription: seed.shortDescription,
          thumbnail: seed.thumbnail,
          instructorId,
          category: seed.category,
          level: seed.level,
          totalLessons: seed.lessons.length,
          status: 'published',
          isFeatured: createdCount < featuredCount,
          publishedAt: new Date(),
        }).returning();

        const [courseModule] = await db.insert(modules).values({
          courseId: course.id,
          title: 'Contenido del curso',
          sortOrder: 0,
        }).returning();

        await db.insert(lessons).values(
          seed.lessons.map((lesson, index) => ({
            moduleId: courseModule.id,
            youtubeVideoId: lesson.youtubeVideoId,
            title: lesson.title,
            videoUrl: `https://www.youtube.com/watch?v=${lesson.youtubeVideoId}`,
            sortOrder: index,
            isFree: true,
            isLocked: false,
          }))
        );

        createdCount++;
        results.push({ title: seed.title, status: 'created' });
      } catch (error) {
        results.push({ title: seed.title, status: 'failed', error: String(error).slice(0, 200) });
      }
    }

    const failed = results.filter((r) => r.status === 'failed');
    return NextResponse.json({
      success: failed.length === 0,
      created: createdCount,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
