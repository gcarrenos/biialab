'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { YouTubeVideo, YouTubeCommentThread } from '@/lib/types';
import { createCourseFromVideos, importVideoComments } from '@/lib/db/actions/youtube';
import { getAllVideoComments, analyzeCommentsSentiment, formatViewCount } from '@/lib/youtube';

interface ImportCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideos: YouTubeVideo[];
  apiKey: string;
}

// Helper to detect category from video title/description
function detectCategory(text: string): string {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('inteligencia artificial') || lowerText.includes('ai') || lowerText.includes('machine learning') || lowerText.includes('ml')) {
    return 'AI & Machine Learning';
  }
  if (lowerText.includes('neuro') || lowerText.includes('cerebro') || lowerText.includes('mente') || lowerText.includes('psicolog')) {
    return 'Psychology';
  }
  if (lowerText.includes('negocio') || lowerText.includes('emprendimiento') || lowerText.includes('ventas') || lowerText.includes('marketing')) {
    return 'Business';
  }
  if (lowerText.includes('liderazgo') || lowerText.includes('líder') || lowerText.includes('equipo')) {
    return 'Leadership';
  }
  if (lowerText.includes('emocional') || lowerText.includes('emociones') || lowerText.includes('felicidad')) {
    return 'Personal Development';
  }
  if (lowerText.includes('financ') || lowerText.includes('dinero') || lowerText.includes('inversión') || lowerText.includes('riqueza')) {
    return 'Finance';
  }
  if (lowerText.includes('salud') || lowerText.includes('bienestar') || lowerText.includes('fitness')) {
    return 'Health & Wellness';
  }
  return 'Personal Development';
}

// Helper to detect level from description
function detectLevel(text: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('avanzado') || lowerText.includes('experto') || lowerText.includes('profesional')) {
    return 'Advanced';
  }
  if (lowerText.includes('intermedio')) {
    return 'Intermediate';
  }
  return 'Beginner';
}

export function ImportCourseModal({ isOpen, onClose, selectedVideos, apiKey }: ImportCourseModalProps) {
  const [step, setStep] = useState<'details' | 'comments' | 'importing' | 'success'>('details');
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    category: 'Personal Development',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    instructorName: '',
    instructorTitle: '',
    instructorBio: '',
  });
  const [importComments, setImportComments] = useState(true);
  const [maxCommentsPerVideo, setMaxCommentsPerVideo] = useState(100);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, status: '' });
  const [result, setResult] = useState<{ courseId?: string; courseSlug?: string; lessonsCreated?: number; commentsImported?: number } | null>(null);

  // Prefill data from selected videos
  useEffect(() => {
    if (selectedVideos.length > 0 && isOpen) {
      const firstVideo = selectedVideos[0];
      const allTitles = selectedVideos.map(v => v.title).join(' ');
      const allDescriptions = selectedVideos.map(v => v.description).join(' ');
      
      // For single video, use video title; for multiple, create a course title
      let title = '';
      if (selectedVideos.length === 1) {
        title = firstVideo.title;
      } else {
        // Try to find common theme or use channel name
        title = `Curso: ${firstVideo.channelTitle || 'BiiALab'}`;
      }

      // Use first video's description, truncated if needed
      const description = firstVideo.description || '';
      const shortDesc = description.slice(0, 200).trim();

      // Detect category and level from content
      const combinedText = allTitles + ' ' + allDescriptions;
      const detectedCategory = detectCategory(combinedText);
      const detectedLevel = detectLevel(combinedText);

      // Get instructor from channel
      const instructorName = firstVideo.channelTitle || '';

      setCourseData(prev => ({
        ...prev,
        title,
        description,
        shortDescription: shortDesc,
        category: detectedCategory,
        level: detectedLevel,
        instructorName,
      }));
    }
  }, [selectedVideos, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setResult(null);
      setImportProgress({ current: 0, total: 0, status: '' });
    }
  }, [isOpen]);

  // Calculate totals
  const totalViews = selectedVideos.reduce((sum, v) => sum + v.viewCount, 0);
  const totalLikes = selectedVideos.reduce((sum, v) => sum + v.likeCount, 0);
  const totalComments = selectedVideos.reduce((sum, v) => sum + v.commentCount, 0);

  const handleImport = async () => {
    setStep('importing');
    setImportProgress({ current: 0, total: selectedVideos.length + (importComments ? selectedVideos.length : 0), status: 'Creating course...' });

    try {
      // Step 1: Create the course with videos
      const courseResult = await createCourseFromVideos(
        courseData,
        selectedVideos.map(v => v.id),
        selectedVideos
      );

      if (!courseResult.success) {
        throw new Error(courseResult.error);
      }

      setImportProgress(prev => ({ ...prev, current: selectedVideos.length, status: 'Course created!' }));

      let totalCommentsImported = 0;

      // Step 2: Import comments if enabled
      if (importComments) {
        for (let i = 0; i < selectedVideos.length; i++) {
          const video = selectedVideos[i];
          setImportProgress(prev => ({
            ...prev,
            current: selectedVideos.length + i,
            status: `Importing comments for "${video.title.slice(0, 30)}..."`,
          }));

          try {
            const comments = await getAllVideoComments(apiKey, video.id, maxCommentsPerVideo);
            if (comments.length > 0) {
              await importVideoComments(video.id, comments);
              totalCommentsImported += comments.length;
            }
          } catch (err) {
            console.warn(`Failed to import comments for ${video.id}:`, err);
          }
        }
      }

      setResult({
        courseId: courseResult.courseId,
        courseSlug: courseResult.courseSlug,
        lessonsCreated: courseResult.lessonsCreated,
        commentsImported: totalCommentsImported,
      });
      setStep('success');
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error}`);
      setStep('details');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-background-light border border-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Import as Course</h2>
            <p className="text-sm text-text-secondary mt-1">
              {selectedVideos.length} video{selectedVideos.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="bg-background rounded-lg p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-text-secondary mb-3">Selected Videos</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedVideos.slice(0, 8).map(video => (
                    <div key={video.id} className="flex-shrink-0 w-24">
                      <div className="relative aspect-video rounded overflow-hidden">
                        <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1 truncate">{video.title}</p>
                    </div>
                  ))}
                  {selectedVideos.length > 8 && (
                    <div className="flex-shrink-0 w-24 aspect-video bg-background-light rounded flex items-center justify-center">
                      <span className="text-sm text-text-secondary">+{selectedVideos.length - 8} more</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-6 mt-3 text-sm">
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{formatViewCount(totalViews)}</span> views
                  </span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{formatViewCount(totalLikes)}</span> likes
                  </span>
                  <span className="text-text-secondary">
                    <span className="text-text-primary font-medium">{formatViewCount(totalComments)}</span> comments
                  </span>
                </div>
              </div>

              {/* Course Details Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Course Title *</label>
                  <input
                    type="text"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    placeholder="e.g., Complete AI & Machine Learning Course"
                    className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Description *</label>
                  <textarea
                    value={courseData.description}
                    onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                    placeholder="Full course description for SEO and course page..."
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Short Description</label>
                  <input
                    type="text"
                    value={courseData.shortDescription}
                    onChange={(e) => setCourseData({ ...courseData, shortDescription: e.target.value })}
                    placeholder="Brief description for cards (max 200 chars)"
                    maxLength={200}
                    className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
                    <select
                      value={courseData.category}
                      onChange={(e) => setCourseData({ ...courseData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Personal Development">Personal Development</option>
                      <option value="Psychology">Psychology</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Business">Business</option>
                      <option value="Finance">Finance</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="AI & Machine Learning">AI & Machine Learning</option>
                      <option value="Technology">Technology</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Design">Design</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Level</label>
                    <select
                      value={courseData.level}
                      onChange={(e) => setCourseData({ ...courseData, level: e.target.value as any })}
                      className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="pt-4 border-t border-gray-800">
                  <h3 className="text-sm font-medium text-text-primary mb-4">Instructor Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Instructor Name</label>
                      <input
                        type="text"
                        value={courseData.instructorName}
                        onChange={(e) => setCourseData({ ...courseData, instructorName: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                      <input
                        type="text"
                        value={courseData.instructorTitle}
                        onChange={(e) => setCourseData({ ...courseData, instructorTitle: e.target.value })}
                        placeholder="e.g., AI Engineer"
                        className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Comment Import Options */}
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-text-primary">Import Comments</h3>
                      <p className="text-xs text-text-secondary mt-1">Import top comments from each video</p>
                    </div>
                    <button
                      onClick={() => setImportComments(!importComments)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${importComments ? 'bg-accent' : 'bg-gray-700'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${importComments ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  {importComments && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Max comments per video</label>
                      <select
                        value={maxCommentsPerVideo}
                        onChange={(e) => setMaxCommentsPerVideo(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value={25}>25 comments</option>
                        <option value={50}>50 comments</option>
                        <option value={100}>100 comments (recommended)</option>
                        <option value={200}>200 comments</option>
                        <option value={500}>500 comments</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Importing Course</h3>
              <p className="text-sm text-text-secondary mb-4">{importProgress.status}</p>
              <div className="w-full max-w-md bg-background rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {importProgress.current} / {importProgress.total}
              </p>
            </div>
          )}

          {step === 'success' && result && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Course Created!</h3>
              <p className="text-text-secondary mb-6 text-center">
                Successfully created course with {result.lessonsCreated} lessons
                {result.commentsImported ? ` and ${result.commentsImported} comments` : ''}
              </p>
              <div className="flex gap-4">
                <a
                  href={`/admin/courses/${result.courseId}`}
                  className="px-6 py-3 bg-accent hover:bg-accent/90 text-white font-medium rounded-md transition-colors"
                >
                  Edit Course
                </a>
                <a
                  href={`/courses/${result.courseSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-background hover:bg-gray-800 text-text-primary font-medium rounded-md border border-gray-800 transition-colors"
                >
                  Preview Course
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'details' && (
          <div className="p-6 border-t border-gray-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!courseData.title || !courseData.description}
              className="px-6 py-2 bg-accent hover:bg-accent/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Course
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 border-t border-gray-800 flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-background hover:bg-gray-800 text-text-primary font-medium rounded-md border border-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
