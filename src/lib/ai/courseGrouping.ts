'use server';

import { YouTubeVideo } from '@/lib/types';

export interface SuggestedCourse {
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  videoIds: string[];
  videos: {
    id: string;
    title: string;
    reason: string; // Why this video belongs in this course
  }[];
  confidence: number; // 0-100
}

export interface AIGroupingResult {
  courses: SuggestedCourse[];
  ungroupedVideos: string[];
  summary: string;
  totalVideosAnalyzed: number;
  wasLimited: boolean;
}

// Maximum videos to analyze at once (to stay within token limits)
const MAX_VIDEOS_PER_ANALYSIS = 50;

// Analyze videos and suggest course groupings using OpenAI
export async function analyzeAndGroupVideos(
  videos: YouTubeVideo[],
  apiKey: string
): Promise<AIGroupingResult> {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  // Limit videos to prevent token overflow
  const wasLimited = videos.length > MAX_VIDEOS_PER_ANALYSIS;
  const videosToAnalyze = wasLimited 
    ? videos.slice(0, MAX_VIDEOS_PER_ANALYSIS) 
    : videos;

  // Prepare video data for AI analysis (compact format to save tokens)
  const videoData = videosToAnalyze.map(v => ({
    id: v.id,
    title: v.title,
    desc: v.description?.slice(0, 200) || '', // Shorter descriptions
    dur: v.duration,
    views: v.viewCount,
  }));

  const prompt = `Analyze ${videosToAnalyze.length} YouTube videos and group them into courses.

Videos (id, title, description excerpt, duration, views):
${videoData.map(v => `- ${v.id}: "${v.title}" | ${v.desc.slice(0, 100)}... | ${v.dur} | ${v.views} views`).join('\n')}

Group by topic similarity, themes, and learning progression.

Return ONLY valid JSON:
{"courses":[{"title":"Course Title","description":"2-3 sentence description","category":"Category","level":"Beginner|Intermediate|Advanced","videos":[{"id":"video_id","title":"Title","reason":"Why it fits"}],"confidence":85}],"ungroupedVideos":["id1"],"summary":"How grouped"}

Rules:
- Each video in ONE course only
- 2-10 videos per course
- Use SAME LANGUAGE as videos
- Categories: Personal Development, Psychology, Business, Leadership, Finance, Health & Wellness, Technology`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content curator. You analyze video content and create logical, engaging course structures. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0];
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(jsonContent.trim());

    // Build result with additional metadata
    const result: AIGroupingResult = {
      courses: (parsed.courses || []).map((course: any) => ({
        ...course,
        videoIds: (course.videos || []).map((v: any) => v.id),
      })),
      ungroupedVideos: parsed.ungroupedVideos || [],
      summary: parsed.summary || 'Videos grouped by topic similarity',
      totalVideosAnalyzed: videosToAnalyze.length,
      wasLimited,
    };

    return result;
  } catch (error) {
    console.error('AI grouping error:', error);
    // Return a more helpful error message
    if (error instanceof Error) {
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
    throw new Error('AI Analysis failed. Please check your API key and try again.');
  }
}

// Quick topic extraction without full grouping
export async function extractTopics(
  videos: YouTubeVideo[],
  apiKey: string
): Promise<string[]> {
  const titles = videos.map(v => v.title).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Extract the main topics/themes from these video titles. Return as a JSON array of strings:\n\n${titles}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    let jsonContent = content;
    if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].replace('json', '');
    }
    return JSON.parse(jsonContent.trim());
  } catch {
    return [];
  }
}

// Generate a course description from video content
export async function generateCourseDescription(
  videos: YouTubeVideo[],
  courseTitle: string,
  apiKey: string
): Promise<{ description: string; shortDescription: string; learningObjectives: string[] }> {
  const videoInfo = videos.map(v => `- ${v.title}: ${v.description?.slice(0, 200) || ''}`).join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Create a compelling course description for "${courseTitle}" based on these videos:

${videoInfo}

Return JSON with:
{
  "description": "Full description (2-3 paragraphs, same language as videos)",
  "shortDescription": "Brief summary for cards (max 150 chars, same language)",
  "learningObjectives": ["What students will learn 1", "What students will learn 2", ...]
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  try {
    let jsonContent = content;
    if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].replace('json', '');
    }
    return JSON.parse(jsonContent.trim());
  } catch {
    return {
      description: '',
      shortDescription: '',
      learningObjectives: [],
    };
  }
}
