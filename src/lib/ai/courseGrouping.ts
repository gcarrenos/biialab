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
}

// Analyze videos and suggest course groupings using OpenAI
export async function analyzeAndGroupVideos(
  videos: YouTubeVideo[],
  apiKey: string
): Promise<AIGroupingResult> {
  // Prepare video data for AI analysis
  const videoData = videos.map(v => ({
    id: v.id,
    title: v.title,
    description: v.description?.slice(0, 500) || '', // Limit description length
    duration: v.duration,
    viewCount: v.viewCount,
    tags: v.tags?.slice(0, 10) || [],
  }));

  const prompt = `Analyze these YouTube videos and group them into logical courses. 
Each course should have videos that teach related topics or form a learning path.

Videos to analyze:
${JSON.stringify(videoData, null, 2)}

Create course groupings based on:
1. Topic similarity (titles, descriptions, tags)
2. Learning progression (beginner to advanced)
3. Thematic connections
4. Series or related content

For each suggested course, provide:
- A compelling course title (in the same language as the videos)
- A brief description (2-3 sentences, same language)
- Category (e.g., Personal Development, Psychology, Business, Leadership, Finance, Health & Wellness, Technology)
- Level (Beginner, Intermediate, or Advanced)
- Which videos belong and WHY
- Confidence score (0-100)

Return ONLY valid JSON in this exact format:
{
  "courses": [
    {
      "title": "Course Title",
      "description": "Course description...",
      "category": "Category Name",
      "level": "Beginner",
      "videos": [
        {"id": "video_id", "title": "Video Title", "reason": "Why this video fits"}
      ],
      "confidence": 85
    }
  ],
  "ungroupedVideos": ["video_id_1", "video_id_2"],
  "summary": "Brief summary of how videos were grouped"
}

Important:
- A video can only belong to ONE course
- Minimum 2 videos per course, ideally 3-10
- If videos don't fit any group well, put them in ungroupedVideos
- Be creative but logical with groupings
- Keep titles and descriptions in the SAME LANGUAGE as the original videos`;

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

    const result = JSON.parse(jsonContent.trim()) as AIGroupingResult;

    // Add videoIds array for convenience
    result.courses = result.courses.map(course => ({
      ...course,
      videoIds: course.videos.map(v => v.id),
    }));

    return result;
  } catch (error) {
    console.error('AI grouping error:', error);
    throw error;
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
