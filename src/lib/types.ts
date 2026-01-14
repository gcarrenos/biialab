export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string; // In minutes:seconds format
  resources?: Resource[];
  quizzes?: Quiz[];
  isLocked?: boolean;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'file';
  url: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: Instructor;
  thumbnail: string;
  category: string;
  duration: string;
  lessons: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isFeatured?: boolean;
  modules?: Module[]; // Added modules for lesson organization
}

export interface UserProgress {
  courseId: string;
  progress: number; // percentage completed
  completed: boolean;
  completedDate?: string;
  certificateId?: string;
  completedLessons?: string[]; // Array of lesson IDs
  currentLessonId?: string; // Current lesson the user is on
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  progress: UserProgress[];
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  completedDate: string;
  pdfUrl: string;
}

// YouTube API Types
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnailHigh: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  channelTitle: string;
  tags?: string[];
  categoryId?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

export interface YouTubeApiResponse<T> {
  items: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

// YouTube Comments
export interface YouTubeComment {
  id: string;
  videoId: string;
  authorName: string;
  authorProfileImage: string;
  authorChannelId?: string;
  text: string;
  textDisplay: string; // HTML formatted
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
  replyCount: number;
  isPublic: boolean;
  replies?: YouTubeComment[];
}

export interface YouTubeCommentThread {
  id: string;
  videoId: string;
  topLevelComment: YouTubeComment;
  totalReplyCount: number;
  replies?: YouTubeComment[];
} 