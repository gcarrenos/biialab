'use server';

import { db } from '@/lib/db';
import { youtubeVideos, youtubeComments, courses, modules, lessons, instructors } from '@/lib/db/schema';
import { YouTubeVideo, YouTubeCommentThread } from '@/lib/types';
import { eq } from 'drizzle-orm';

// Import a single YouTube video to the database
export async function importYouTubeVideo(video: YouTubeVideo) {
  try {
    // Parse duration to seconds
    const durationParts = video.duration.split(':').map(Number);
    let durationSeconds = 0;
    if (durationParts.length === 3) {
      durationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
    } else if (durationParts.length === 2) {
      durationSeconds = durationParts[0] * 60 + durationParts[1];
    }

    const result = await db.insert(youtubeVideos).values({
      id: video.id,
      title: video.title,
      description: video.description,
      channelId: video.channelTitle ? undefined : undefined, // We don't have this in the current type
      channelTitle: video.channelTitle,
      thumbnailMedium: video.thumbnail,
      thumbnailHigh: video.thumbnailHigh,
      duration: video.duration,
      durationSeconds,
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      tags: video.tags || [],
      categoryId: video.categoryId,
      publishedAt: new Date(video.publishedAt),
      isActive: true,
    }).onConflictDoUpdate({
      target: youtubeVideos.id,
      set: {
        title: video.title,
        description: video.description,
        thumbnailMedium: video.thumbnail,
        thumbnailHigh: video.thumbnailHigh,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        tags: video.tags || [],
        lastSyncedAt: new Date(),
      },
    }).returning();

    return { success: true, video: result[0] };
  } catch (error) {
    console.error('Error importing YouTube video:', error);
    return { success: false, error: String(error) };
  }
}

// Import multiple YouTube videos
export async function importYouTubeVideos(videos: YouTubeVideo[]) {
  const results = await Promise.all(videos.map(importYouTubeVideo));
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  return { successful, failed, total: videos.length };
}

// Import comments for a video
export async function importVideoComments(videoId: string, comments: YouTubeCommentThread[]) {
  try {
    const commentsToInsert = comments.flatMap(thread => {
      const topComment = {
        id: thread.topLevelComment.id,
        videoId: videoId,
        parentId: null,
        authorName: thread.topLevelComment.authorName,
        authorProfileImage: thread.topLevelComment.authorProfileImage,
        authorChannelId: thread.topLevelComment.authorChannelId,
        text: thread.topLevelComment.text,
        textDisplay: thread.topLevelComment.textDisplay,
        likeCount: thread.topLevelComment.likeCount,
        replyCount: thread.totalReplyCount,
        publishedAt: new Date(thread.topLevelComment.publishedAt),
        updatedAt: thread.topLevelComment.updatedAt ? new Date(thread.topLevelComment.updatedAt) : null,
      };

      const replies = (thread.replies || []).map(reply => ({
        id: reply.id,
        videoId: videoId,
        parentId: thread.topLevelComment.id,
        authorName: reply.authorName,
        authorProfileImage: reply.authorProfileImage,
        authorChannelId: reply.authorChannelId,
        text: reply.text,
        textDisplay: reply.textDisplay,
        likeCount: reply.likeCount,
        replyCount: 0,
        publishedAt: new Date(reply.publishedAt),
        updatedAt: reply.updatedAt ? new Date(reply.updatedAt) : null,
      }));

      return [topComment, ...replies];
    });

    // Insert in batches to avoid issues
    const BATCH_SIZE = 100;
    for (let i = 0; i < commentsToInsert.length; i += BATCH_SIZE) {
      const batch = commentsToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(youtubeComments).values(batch).onConflictDoNothing();
    }

    return { success: true, imported: commentsToInsert.length };
  } catch (error) {
    console.error('Error importing comments:', error);
    return { success: false, error: String(error) };
  }
}

// Create a course from YouTube videos
export async function createCourseFromVideos(
  courseData: {
    title: string;
    description: string;
    shortDescription?: string;
    category?: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced';
    instructorName?: string;
    instructorTitle?: string;
    instructorBio?: string;
  },
  videoIds: string[],
  existingVideos: YouTubeVideo[]
) {
  try {
    // First, import all selected videos to youtube_videos table
    const videosToImport = existingVideos.filter(v => videoIds.includes(v.id));
    await importYouTubeVideos(videosToImport);

    // Create or get instructor
    let instructorId: string | null = null;
    if (courseData.instructorName) {
      const existingInstructor = await db.query.instructors.findFirst({
        where: eq(instructors.name, courseData.instructorName),
      });

      if (existingInstructor) {
        instructorId = existingInstructor.id;
      } else {
        const newInstructor = await db.insert(instructors).values({
          name: courseData.instructorName,
          title: courseData.instructorTitle,
          bio: courseData.instructorBio,
          avatar: videosToImport[0]?.thumbnail, // Use first video thumbnail as default
        }).returning();
        instructorId = newInstructor[0].id;
      }
    }

    // Calculate total duration
    const totalSeconds = videosToImport.reduce((sum, v) => {
      const parts = v.duration.split(':').map(Number);
      if (parts.length === 3) return sum + parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return sum + parts[0] * 60 + parts[1];
      return sum;
    }, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const durationString = totalHours > 0 
      ? `${totalHours}h ${totalMinutes}m` 
      : `${totalMinutes} minutes`;

    // Create slug from title
    const slug = courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);

    // Create the course
    const newCourse = await db.insert(courses).values({
      slug,
      title: courseData.title,
      description: courseData.description,
      shortDescription: courseData.shortDescription || courseData.description?.slice(0, 200),
      thumbnail: videosToImport[0]?.thumbnailHigh || videosToImport[0]?.thumbnail,
      instructorId,
      category: courseData.category,
      level: courseData.level,
      duration: durationString,
      totalLessons: videosToImport.length,
      status: 'published',
      isFeatured: false,
      publishedAt: new Date(),
    }).returning();

    const courseId = newCourse[0].id;

    // Create a single module for the course (can be split later)
    const newModule = await db.insert(modules).values({
      courseId,
      title: 'Course Content',
      description: 'All lessons in this course',
      sortOrder: 0,
    }).returning();

    const moduleId = newModule[0].id;

    // Create lessons from videos
    const lessonsToCreate = videosToImport.map((video, index) => ({
      moduleId,
      youtubeVideoId: video.id,
      title: video.title,
      description: video.description,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      duration: video.duration,
      durationSeconds: (() => {
        const parts = video.duration.split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        return 0;
      })(),
      sortOrder: index,
      isFree: index === 0, // First lesson is free preview
      isLocked: false,
    }));

    await db.insert(lessons).values(lessonsToCreate);

    return { 
      success: true, 
      courseId, 
      courseSlug: slug,
      lessonsCreated: lessonsToCreate.length,
    };
  } catch (error) {
    console.error('Error creating course from videos:', error);
    return { success: false, error: String(error) };
  }
}

// Get all imported YouTube videos from database
export async function getImportedVideos() {
  try {
    const videos = await db.query.youtubeVideos.findMany({
      orderBy: (videos, { desc }) => [desc(videos.importedAt)],
    });
    return { success: true, videos };
  } catch (error) {
    console.error('Error fetching imported videos:', error);
    return { success: false, error: String(error), videos: [] };
  }
}

// Get comments for a video from database
export async function getVideoCommentsFromDB(videoId: string) {
  try {
    const comments = await db.query.youtubeComments.findMany({
      where: eq(youtubeComments.videoId, videoId),
      orderBy: (comments, { desc }) => [desc(comments.likeCount)],
    });
    return { success: true, comments };
  } catch (error) {
    console.error('Error fetching comments:', error);
    return { success: false, error: String(error), comments: [] };
  }
}
