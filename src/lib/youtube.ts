import { YouTubeVideo, YouTubeChannel, YouTubeComment, YouTubeCommentThread } from './types';

// YouTube API configuration
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Helper to format duration from ISO 8601 to readable format
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper to format view count
export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Helper to format date
export function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper to calculate time ago
export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}

// Get channel info
export async function getChannelInfo(apiKey: string, channelId: string): Promise<YouTubeChannel | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails?.default?.url || '',
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0'),
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw error;
  }
}

// Get uploads playlist ID from channel
export async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].contentDetails.relatedPlaylists.uploads;
    }

    return null;
  } catch (error) {
    console.error('Error fetching uploads playlist ID:', error);
    throw error;
  }
}

// Helper to fetch video stats in batches
async function fetchVideoStats(apiKey: string, videoIds: string[]): Promise<Map<string, any>> {
  const statsMap = new Map();
  
  // YouTube API allows max 50 video IDs per request
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const idsParam = batch.join(',');
    
    try {
      const statsResponse = await fetch(
        `${YOUTUBE_API_BASE}/videos?part=statistics,contentDetails,snippet&id=${idsParam}&key=${apiKey}`
      );

      if (!statsResponse.ok) {
        console.warn(`Failed to fetch stats for batch ${i / BATCH_SIZE + 1}: ${statsResponse.status}`);
        continue;
      }

      const statsData = await statsResponse.json();

      statsData.items?.forEach((item: any) => {
        statsMap.set(item.id, {
          viewCount: parseInt(item.statistics?.viewCount || '0'),
          likeCount: parseInt(item.statistics?.likeCount || '0'),
          commentCount: parseInt(item.statistics?.commentCount || '0'),
          duration: item.contentDetails?.duration || 'PT0S',
          tags: item.snippet?.tags || [],
          categoryId: item.snippet?.categoryId,
        });
      });
    } catch (err) {
      console.warn(`Error fetching stats batch ${i / BATCH_SIZE + 1}:`, err);
    }
  }
  
  return statsMap;
}

// Get videos from a playlist
export async function getPlaylistVideos(
  apiKey: string,
  playlistId: string,
  maxResults: number = 50,
  pageToken?: string
): Promise<{ videos: YouTubeVideo[]; nextPageToken?: string }> {
  try {
    let url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // Get video IDs to fetch statistics
    const videoIds = data.items
      .map((item: any) => item.contentDetails?.videoId)
      .filter((id: string | undefined) => id); // Filter out any undefined IDs

    // Fetch video statistics in batches
    const statsMap = await fetchVideoStats(apiKey, videoIds);

    const videos: YouTubeVideo[] = data.items
      .filter((item: any) => item.contentDetails?.videoId)
      .map((item: any) => {
      const videoId = item.contentDetails.videoId;
      const stats = statsMap.get(videoId) || {};

      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        thumbnailHigh: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        publishedAt: item.snippet.publishedAt,
        duration: formatDuration(stats.duration || 'PT0S'),
        viewCount: stats.viewCount || 0,
        likeCount: stats.likeCount || 0,
        commentCount: stats.commentCount || 0,
        channelTitle: item.snippet.channelTitle,
        tags: stats.tags || [],
        categoryId: stats.categoryId,
      };
    });

    return {
      videos,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    throw error;
  }
}

// Get all videos from a channel
export async function getAllChannelVideos(
  apiKey: string,
  channelId: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<YouTubeVideo[]> {
  const playlistId = await getUploadsPlaylistId(apiKey, channelId);

  if (!playlistId) {
    throw new Error('Could not find uploads playlist for this channel');
  }

  const allVideos: YouTubeVideo[] = [];
  let nextPageToken: string | undefined;
  let totalEstimate = 50; // Initial estimate

  do {
    const { videos, nextPageToken: newPageToken } = await getPlaylistVideos(
      apiKey,
      playlistId,
      50,
      nextPageToken
    );

    allVideos.push(...videos);
    nextPageToken = newPageToken;

    // Update estimate based on loaded videos
    if (nextPageToken) {
      totalEstimate = Math.max(totalEstimate, allVideos.length + 50);
    } else {
      totalEstimate = allVideos.length;
    }

    if (onProgress) {
      onProgress(allVideos.length, totalEstimate);
    }
  } while (nextPageToken);

  return allVideos;
}

// Search channel videos
export async function searchChannelVideos(
  apiKey: string,
  channelId: string,
  query: string,
  maxResults: number = 25
): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // Get video IDs to fetch statistics
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video statistics
    const statsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`
    );

    if (!statsResponse.ok) {
      throw new Error(`YouTube API error: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();

    // Create a map of video stats
    const statsMap = new Map();
    statsData.items.forEach((item: any) => {
      statsMap.set(item.id, {
        viewCount: parseInt(item.statistics.viewCount || '0'),
        likeCount: parseInt(item.statistics.likeCount || '0'),
        commentCount: parseInt(item.statistics.commentCount || '0'),
        duration: item.contentDetails.duration,
      });
    });

    const videos: YouTubeVideo[] = data.items.map((item: any) => {
      const videoId = item.id.videoId;
      const stats = statsMap.get(videoId) || {};

      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
        thumbnailHigh: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        publishedAt: item.snippet.publishedAt,
        duration: formatDuration(stats.duration || 'PT0S'),
        viewCount: stats.viewCount || 0,
        likeCount: stats.likeCount || 0,
        commentCount: stats.commentCount || 0,
        channelTitle: item.snippet.channelTitle,
      };
    });

    return videos;
  } catch (error) {
    console.error('Error searching channel videos:', error);
    throw error;
  }
}

// Sort options for videos
export type SortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'views-desc' 
  | 'views-asc' 
  | 'likes-desc' 
  | 'likes-asc'
  | 'comments-desc'
  | 'comments-asc'
  | 'duration-desc'
  | 'duration-asc'
  | 'title-asc'
  | 'title-desc';

// Parse duration string to seconds for sorting
function durationToSeconds(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

// Sort videos
export function sortVideos(videos: YouTubeVideo[], sortBy: SortOption): YouTubeVideo[] {
  const sorted = [...videos];

  switch (sortBy) {
    case 'date-desc':
      return sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    case 'date-asc':
      return sorted.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
    case 'views-desc':
      return sorted.sort((a, b) => b.viewCount - a.viewCount);
    case 'views-asc':
      return sorted.sort((a, b) => a.viewCount - b.viewCount);
    case 'likes-desc':
      return sorted.sort((a, b) => b.likeCount - a.likeCount);
    case 'likes-asc':
      return sorted.sort((a, b) => a.likeCount - b.likeCount);
    case 'comments-desc':
      return sorted.sort((a, b) => b.commentCount - a.commentCount);
    case 'comments-asc':
      return sorted.sort((a, b) => a.commentCount - b.commentCount);
    case 'duration-desc':
      return sorted.sort((a, b) => durationToSeconds(b.duration) - durationToSeconds(a.duration));
    case 'duration-asc':
      return sorted.sort((a, b) => durationToSeconds(a.duration) - durationToSeconds(b.duration));
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

// Filter options for videos
export interface VideoFilters {
  searchQuery?: string;
  minViews?: number;
  maxViews?: number;
  minDuration?: number; // in seconds
  maxDuration?: number; // in seconds
  publishedAfter?: Date;
  publishedBefore?: Date;
}

// Filter videos
export function filterVideos(videos: YouTubeVideo[], filters: VideoFilters): YouTubeVideo[] {
  return videos.filter(video => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = video.title.toLowerCase().includes(query);
      const matchesDescription = video.description.toLowerCase().includes(query);
      const matchesTags = video.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesTitle && !matchesDescription && !matchesTags) {
        return false;
      }
    }

    // View count filters
    if (filters.minViews !== undefined && video.viewCount < filters.minViews) {
      return false;
    }
    if (filters.maxViews !== undefined && video.viewCount > filters.maxViews) {
      return false;
    }

    // Duration filters
    const durationSeconds = durationToSeconds(video.duration);
    if (filters.minDuration !== undefined && durationSeconds < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration !== undefined && durationSeconds > filters.maxDuration) {
      return false;
    }

    // Date filters
    const publishedDate = new Date(video.publishedAt);
    if (filters.publishedAfter && publishedDate < filters.publishedAfter) {
      return false;
    }
    if (filters.publishedBefore && publishedDate > filters.publishedBefore) {
      return false;
    }

    return true;
  });
}

// Calculate video statistics summary
export function calculateVideoStats(videos: YouTubeVideo[]) {
  if (videos.length === 0) {
    return {
      totalVideos: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      avgViews: 0,
      avgLikes: 0,
      avgComments: 0,
      topVideo: null as YouTubeVideo | null,
    };
  }

  const totalViews = videos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likeCount, 0);
  const totalComments = videos.reduce((sum, v) => sum + v.commentCount, 0);

  const topVideo = videos.reduce((top, video) => 
    video.viewCount > (top?.viewCount || 0) ? video : top
  , videos[0]);

  return {
    totalVideos: videos.length,
    totalViews,
    totalLikes,
    totalComments,
    avgViews: Math.round(totalViews / videos.length),
    avgLikes: Math.round(totalLikes / videos.length),
    avgComments: Math.round(totalComments / videos.length),
    topVideo,
  };
}

// ============================================
// COMMENTS API
// ============================================

// Parse a comment from the API response
function parseComment(item: any, videoId: string): YouTubeComment {
  const snippet = item.snippet;
  return {
    id: item.id,
    videoId: videoId,
    authorName: snippet.authorDisplayName,
    authorProfileImage: snippet.authorProfileImageUrl,
    authorChannelId: snippet.authorChannelId?.value,
    text: snippet.textOriginal,
    textDisplay: snippet.textDisplay,
    likeCount: snippet.likeCount || 0,
    publishedAt: snippet.publishedAt,
    updatedAt: snippet.updatedAt,
    replyCount: 0,
    isPublic: snippet.isPublic !== false,
  };
}

// Get comments for a video
export async function getVideoComments(
  apiKey: string,
  videoId: string,
  maxResults: number = 100,
  pageToken?: string,
  order: 'time' | 'relevance' = 'relevance'
): Promise<{ comments: YouTubeCommentThread[]; nextPageToken?: string; totalCount: number }> {
  try {
    let url = `${YOUTUBE_API_BASE}/commentThreads?part=snippet,replies&videoId=${videoId}&maxResults=${Math.min(maxResults, 100)}&order=${order}&key=${apiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Handle disabled comments
      if (response.status === 403 && errorData.error?.errors?.[0]?.reason === 'commentsDisabled') {
        return { comments: [], nextPageToken: undefined, totalCount: 0 };
      }
      throw new Error(`YouTube API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    const comments: YouTubeCommentThread[] = data.items?.map((item: any) => {
      const topLevelComment = parseComment(
        { id: item.snippet.topLevelComment.id, snippet: item.snippet.topLevelComment.snippet },
        videoId
      );
      topLevelComment.replyCount = item.snippet.totalReplyCount || 0;

      // Parse replies if available
      const replies: YouTubeComment[] = item.replies?.comments?.map((reply: any) =>
        parseComment({ id: reply.id, snippet: reply.snippet }, videoId)
      ) || [];

      return {
        id: item.id,
        videoId: videoId,
        topLevelComment,
        totalReplyCount: item.snippet.totalReplyCount || 0,
        replies,
      };
    }) || [];

    return {
      comments,
      nextPageToken: data.nextPageToken,
      totalCount: data.pageInfo?.totalResults || comments.length,
    };
  } catch (error) {
    console.error('Error fetching video comments:', error);
    throw error;
  }
}

// Get ALL comments for a video (handles pagination)
export async function getAllVideoComments(
  apiKey: string,
  videoId: string,
  maxComments: number = 500, // Limit to avoid quota issues
  order: 'time' | 'relevance' = 'relevance',
  onProgress?: (loaded: number) => void
): Promise<YouTubeCommentThread[]> {
  const allComments: YouTubeCommentThread[] = [];
  let nextPageToken: string | undefined;

  do {
    const { comments, nextPageToken: newPageToken } = await getVideoComments(
      apiKey,
      videoId,
      100,
      nextPageToken,
      order
    );

    allComments.push(...comments);
    nextPageToken = newPageToken;

    if (onProgress) {
      onProgress(allComments.length);
    }

    // Stop if we've reached the max
    if (allComments.length >= maxComments) {
      break;
    }
  } while (nextPageToken);

  return allComments.slice(0, maxComments);
}

// Get comment replies
export async function getCommentReplies(
  apiKey: string,
  parentId: string,
  maxResults: number = 50,
  pageToken?: string
): Promise<{ replies: YouTubeComment[]; nextPageToken?: string }> {
  try {
    let url = `${YOUTUBE_API_BASE}/comments?part=snippet&parentId=${parentId}&maxResults=${Math.min(maxResults, 100)}&key=${apiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    const replies: YouTubeComment[] = data.items?.map((item: any) =>
      parseComment({ id: item.id, snippet: item.snippet }, item.snippet.videoId)
    ) || [];

    return {
      replies,
      nextPageToken: data.nextPageToken,
    };
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    throw error;
  }
}

// Analyze comments sentiment (basic keyword analysis)
export function analyzeCommentsSentiment(comments: YouTubeCommentThread[]) {
  const positiveKeywords = ['great', 'awesome', 'amazing', 'love', 'excellent', 'best', 'perfect', 'helpful', 'thank', 'thanks', 'good', 'nice', 'wonderful', 'fantastic', 'brilliant', 'incredible'];
  const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'boring', 'waste', 'poor', 'disappointed', 'disappointing', 'useless', 'horrible', 'sucks'];
  const questionKeywords = ['how', 'what', 'where', 'when', 'why', 'can you', 'could you', 'please', '?'];

  let positive = 0;
  let negative = 0;
  let questions = 0;
  let totalLikes = 0;

  comments.forEach(thread => {
    const text = thread.topLevelComment.text.toLowerCase();
    totalLikes += thread.topLevelComment.likeCount;

    if (positiveKeywords.some(kw => text.includes(kw))) {
      positive++;
    }
    if (negativeKeywords.some(kw => text.includes(kw))) {
      negative++;
    }
    if (questionKeywords.some(kw => text.includes(kw))) {
      questions++;
    }
  });

  const total = comments.length || 1;

  return {
    totalComments: comments.length,
    totalLikes,
    positive,
    negative,
    neutral: total - positive - negative,
    questions,
    positivePercent: Math.round((positive / total) * 100),
    negativePercent: Math.round((negative / total) * 100),
    questionPercent: Math.round((questions / total) * 100),
    avgLikesPerComment: Math.round(totalLikes / total),
    topComments: [...comments]
      .sort((a, b) => b.topLevelComment.likeCount - a.topLevelComment.likeCount)
      .slice(0, 10),
  };
}
