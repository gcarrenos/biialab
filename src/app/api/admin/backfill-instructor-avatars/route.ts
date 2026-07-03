import { NextResponse } from 'next/server';
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { instructors, youtubeVideos } from '@/lib/db/schema';

export const maxDuration = 60;

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface AvatarOverride {
  name: string;
  avatar: string;
}

// Backfills instructors.avatar from the instructor's YouTube channel picture.
// An instructor is matched to a channel through a youtube_videos row whose
// channelTitle equals the instructor name (seeded lessons keep channel
// attribution), so curators without a channel are skipped — set those via the
// "avatars" override list instead. Idempotent: only null avatars are touched
// unless overwrite is true. Admin-gated.
export async function POST(request: Request) {
  try {
    const { password, overwrite = false, avatars } = await request.json();

    const adminPassword = process.env.ADMIN_PASSWORD || 'biialab2026';
    if (password !== adminPassword) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const results: { name: string; status: 'updated' | 'skipped' | 'failed'; error?: string }[] = [];

    // Manual overrides first (e.g. curators who are not YouTube channels)
    if (Array.isArray(avatars)) {
      for (const override of avatars as AvatarOverride[]) {
        if (!override?.name || typeof override.avatar !== 'string' || !/^https:\/\//.test(override.avatar)) {
          results.push({ name: override?.name ?? '?', status: 'failed', error: 'invalid override' });
          continue;
        }
        const updated = await db.update(instructors)
          .set({ avatar: override.avatar, updatedAt: new Date() })
          .where(eq(instructors.name, override.name))
          .returning({ id: instructors.id });
        results.push({ name: override.name, status: updated.length > 0 ? 'updated' : 'failed', ...(updated.length === 0 && { error: 'instructor not found' }) });
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: results.length > 0,
        results,
        message: 'NEXT_PUBLIC_YOUTUBE_API_KEY not set — only overrides were applied',
      });
    }

    const pending = overwrite
      ? await db.query.instructors.findMany()
      : await db.query.instructors.findMany({ where: isNull(instructors.avatar) });

    // Map each instructor to one of their channel's videos
    const videoByInstructor = new Map<string, { instructorId: string; videoId: string }>();
    for (const instructor of pending) {
      if (results.some((r) => r.name === instructor.name && r.status === 'updated')) continue;
      const video = await db.query.youtubeVideos.findFirst({
        where: eq(youtubeVideos.channelTitle, instructor.name),
      });
      if (video) {
        videoByInstructor.set(instructor.name, { instructorId: instructor.id, videoId: video.id });
      } else {
        results.push({ name: instructor.name, status: 'skipped', error: 'no lesson video matches this channel name' });
      }
    }

    if (videoByInstructor.size === 0) {
      return NextResponse.json({ success: true, results });
    }

    // videoId -> channelId (one batched call, API allows 50 ids)
    const videoIds = [...new Set([...videoByInstructor.values()].map((v) => v.videoId))];
    const videosRes = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet&id=${videoIds.join(',')}&key=${apiKey}`
    );
    if (!videosRes.ok) {
      return NextResponse.json({ success: false, results, message: `YouTube API error (videos): ${videosRes.status}` }, { status: 502 });
    }
    const videosData = await videosRes.json();
    const channelByVideo = new Map<string, string>(
      (videosData.items ?? []).map((item: { id: string; snippet: { channelId: string } }) => [item.id, item.snippet.channelId])
    );

    // channelId -> avatar url (second batched call)
    const channelIds = [...new Set([...channelByVideo.values()])];
    const channelsRes = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet&id=${channelIds.join(',')}&key=${apiKey}`
    );
    if (!channelsRes.ok) {
      return NextResponse.json({ success: false, results, message: `YouTube API error (channels): ${channelsRes.status}` }, { status: 502 });
    }
    const channelsData = await channelsRes.json();
    const avatarByChannel = new Map<string, string>(
      (channelsData.items ?? []).map((item: { id: string; snippet: { thumbnails?: Record<string, { url: string }> } }) => [
        item.id,
        item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      ])
    );

    for (const [name, { instructorId, videoId }] of videoByInstructor) {
      const channelId = channelByVideo.get(videoId);
      const avatar = channelId ? avatarByChannel.get(channelId) : undefined;
      if (!avatar) {
        results.push({ name, status: 'failed', error: 'channel avatar not found' });
        continue;
      }
      await db.update(instructors)
        .set({ avatar, updatedAt: new Date() })
        .where(eq(instructors.id, instructorId));
      results.push({ name, status: 'updated' });
    }

    return NextResponse.json({
      success: true,
      updated: results.filter((r) => r.status === 'updated').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    });
  } catch (error) {
    console.error('backfill-instructor-avatars error:', error);
    return NextResponse.json({ success: false, message: 'Internal error' }, { status: 500 });
  }
}
