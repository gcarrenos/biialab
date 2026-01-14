import { 
  pgTable, 
  text, 
  varchar, 
  timestamp, 
  integer, 
  boolean, 
  uuid,
  jsonb,
  serial,
  primaryKey
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS & AUTHENTICATION
// ============================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  avatar: text('avatar'),
  passwordHash: text('password_hash'), // For email/password auth
  emailVerified: boolean('email_verified').default(false),
  role: varchar('role', { length: 50 }).default('user'), // user, admin, instructor
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// OAuth accounts linked to users
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 50 }).notNull(), // google, github, etc
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions for authentication
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// YOUTUBE VIDEOS (Imported)
// ============================================

export const youtubeVideos = pgTable('youtube_videos', {
  id: varchar('id', { length: 50 }).primaryKey(), // YouTube video ID
  title: text('title').notNull(),
  description: text('description'),
  channelId: varchar('channel_id', { length: 50 }),
  channelTitle: varchar('channel_title', { length: 255 }),
  
  // Thumbnails
  thumbnailDefault: text('thumbnail_default'),
  thumbnailMedium: text('thumbnail_medium'),
  thumbnailHigh: text('thumbnail_high'),
  thumbnailStandard: text('thumbnail_standard'),
  thumbnailMaxres: text('thumbnail_maxres'),
  
  // Video details
  duration: varchar('duration', { length: 20 }), // Formatted duration (e.g., "10:30")
  durationSeconds: integer('duration_seconds'), // Duration in seconds for sorting
  definition: varchar('definition', { length: 10 }), // hd or sd
  hasCaption: boolean('has_caption').default(false),
  
  // Statistics (updated periodically)
  viewCount: integer('view_count').default(0),
  likeCount: integer('like_count').default(0),
  commentCount: integer('comment_count').default(0),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>(),
  categoryId: varchar('category_id', { length: 10 }),
  publishedAt: timestamp('published_at'),
  
  // Import tracking
  importedAt: timestamp('imported_at').defaultNow().notNull(),
  lastSyncedAt: timestamp('last_synced_at').defaultNow().notNull(),
  
  // Status
  isActive: boolean('is_active').default(true),
});

// ============================================
// YOUTUBE COMMENTS
// ============================================

export const youtubeComments = pgTable('youtube_comments', {
  id: varchar('id', { length: 100 }).primaryKey(), // YouTube comment ID
  videoId: varchar('video_id', { length: 50 }).notNull().references(() => youtubeVideos.id, { onDelete: 'cascade' }),
  parentId: varchar('parent_id', { length: 100 }), // For replies
  
  // Author info
  authorName: varchar('author_name', { length: 255 }).notNull(),
  authorProfileImage: text('author_profile_image'),
  authorChannelId: varchar('author_channel_id', { length: 50 }),
  
  // Comment content
  text: text('text').notNull(), // Plain text
  textDisplay: text('text_display'), // HTML formatted
  
  // Stats
  likeCount: integer('like_count').default(0),
  replyCount: integer('reply_count').default(0),
  
  // Dates
  publishedAt: timestamp('published_at').notNull(),
  updatedAt: timestamp('updated_at'),
  
  // Import tracking
  importedAt: timestamp('imported_at').defaultNow().notNull(),
  
  // Analysis (optional - for sentiment analysis results)
  sentiment: varchar('sentiment', { length: 20 }), // positive, negative, neutral, question
});

// ============================================
// INSTRUCTORS
// ============================================

export const instructors = pgTable('instructors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id), // Optional link to user account
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }), // e.g., "AI Researcher at Google"
  bio: text('bio'),
  avatar: text('avatar'),
  website: text('website'),
  twitter: varchar('twitter', { length: 100 }),
  linkedin: varchar('linkedin', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// COURSES
// ============================================

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(), // URL-friendly identifier
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  shortDescription: varchar('short_description', { length: 500 }),
  thumbnail: text('thumbnail'),
  
  // Course metadata
  instructorId: uuid('instructor_id').references(() => instructors.id),
  category: varchar('category', { length: 100 }),
  level: varchar('level', { length: 50 }), // Beginner, Intermediate, Advanced
  duration: varchar('duration', { length: 50 }), // Total duration (e.g., "4 hours")
  totalLessons: integer('total_lessons').default(0),
  
  // Pricing
  price: integer('price').default(0), // In cents, 0 = free
  currency: varchar('currency', { length: 3 }).default('USD'),
  
  // Status
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  isFeatured: boolean('is_featured').default(false),
  publishedAt: timestamp('published_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// MODULES (Course sections)
// ============================================

export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// LESSONS
// ============================================

export const lessons = pgTable('lessons', {
  id: uuid('id').defaultRandom().primaryKey(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  youtubeVideoId: varchar('youtube_video_id', { length: 50 }).references(() => youtubeVideos.id),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Video can be YouTube or custom URL
  videoUrl: text('video_url'),
  duration: varchar('duration', { length: 20 }),
  durationSeconds: integer('duration_seconds'),
  
  // Lesson settings
  sortOrder: integer('sort_order').default(0),
  isFree: boolean('is_free').default(false), // Free preview lesson
  isLocked: boolean('is_locked').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// LESSON RESOURCES (PDFs, links, files)
// ============================================

export const lessonResources = pgTable('lesson_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // pdf, link, file
  url: text('url').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// QUIZZES
// ============================================

export const quizzes = pgTable('quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  passingScore: integer('passing_score').default(70), // Percentage
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').$type<string[]>().notNull(),
  correctOptionIndex: integer('correct_option_index').notNull(),
  explanation: text('explanation'),
  sortOrder: integer('sort_order').default(0),
});

// ============================================
// USER PROGRESS & ENROLLMENTS
// ============================================

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  progress: integer('progress').default(0), // Percentage
  currentLessonId: uuid('current_lesson_id').references(() => lessons.id),
});

export const lessonProgress = pgTable('lesson_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  completed: boolean('completed').default(false),
  watchedSeconds: integer('watched_seconds').default(0),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const quizAttempts = pgTable('quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(), // Percentage
  passed: boolean('passed').notNull(),
  answers: jsonb('answers').$type<Record<string, number>>(), // questionId -> selectedOptionIndex
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
});

// ============================================
// CERTIFICATES
// ============================================

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  certificateNumber: varchar('certificate_number', { length: 50 }).notNull().unique(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  pdfUrl: text('pdf_url'),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  enrollments: many(enrollments),
  lessonProgress: many(lessonProgress),
  quizAttempts: many(quizAttempts),
  certificates: many(certificates),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(instructors, {
    fields: [courses.instructorId],
    references: [instructors.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
  certificates: many(certificates),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  youtubeVideo: one(youtubeVideos, {
    fields: [lessons.youtubeVideoId],
    references: [youtubeVideos.id],
  }),
  resources: many(lessonResources),
  quizzes: many(quizzes),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  currentLesson: one(lessons, {
    fields: [enrollments.currentLessonId],
    references: [lessons.id],
  }),
}));
