'use client';

import { useState } from 'react';
import Image from 'next/image';
import { YouTubeVideo } from '@/lib/types';
import { analyzeAndGroupVideos, SuggestedCourse, AIGroupingResult } from '@/lib/ai/courseGrouping';
import { createCourseFromVideos } from '@/lib/db/actions/youtube';

interface AIGroupingModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: YouTubeVideo[];
  openAIKey: string;
  onCoursesCreated: () => void;
}

export function AIGroupingModal({ isOpen, onClose, videos, openAIKey, onCoursesCreated }: AIGroupingModalProps) {
  const [step, setStep] = useState<'config' | 'analyzing' | 'results' | 'creating'>('config');
  const [result, setResult] = useState<AIGroupingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [creatingProgress, setCreatingProgress] = useState({ current: 0, total: 0, status: '' });
  const [createdCourses, setCreatedCourses] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(openAIKey);

  const handleAnalyze = async () => {
    if (!apiKey) {
      setError('Please enter your OpenAI API key');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const groupingResult = await analyzeAndGroupVideos(videos, apiKey);
      setResult(groupingResult);
      // Select all courses by default
      setSelectedCourses(new Set(groupingResult.courses.map((_, i) => i)));
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze videos');
      setStep('config');
    }
  };

  const toggleCourseSelection = (index: number) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedCourses(newSelection);
  };

  const handleCreateCourses = async () => {
    if (!result) return;

    const coursesToCreate = result.courses.filter((_, i) => selectedCourses.has(i));
    setStep('creating');
    setCreatingProgress({ current: 0, total: coursesToCreate.length, status: 'Starting...' });
    setCreatedCourses([]);

    for (let i = 0; i < coursesToCreate.length; i++) {
      const course = coursesToCreate[i];
      setCreatingProgress({
        current: i,
        total: coursesToCreate.length,
        status: `Creating: ${course.title}`,
      });

      try {
        // Get full video objects for this course
        const courseVideos = videos.filter(v => course.videoIds.includes(v.id));

        await createCourseFromVideos(
          {
            title: course.title,
            description: course.description,
            shortDescription: course.description.slice(0, 200),
            category: course.category,
            level: course.level,
            instructorName: courseVideos[0]?.channelTitle || 'BiiALab',
            instructorTitle: 'Instructor',
            instructorBio: '',
          },
          course.videoIds,
          courseVideos
        );

        setCreatedCourses(prev => [...prev, course.title]);
      } catch (err) {
        console.error(`Failed to create course: ${course.title}`, err);
      }
    }

    setCreatingProgress({
      current: coursesToCreate.length,
      total: coursesToCreate.length,
      status: 'Complete!',
    });

    // Notify parent
    onCoursesCreated();
  };

  const handleClose = () => {
    setStep('config');
    setResult(null);
    setError(null);
    setSelectedCourses(new Set());
    setCreatedCourses([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-background-light border border-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Course Grouping
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {videos.length} videos to analyze
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-background rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'config' && (
            <div className="space-y-6">
              <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-400 mb-2">How it works</h3>
                <p className="text-sm text-text-secondary">
                  AI will analyze your video titles, descriptions, and tags to suggest logical course groupings.
                  Videos with similar topics, themes, or learning progressions will be grouped together.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-text-secondary mt-2">
                  Your API key is not stored. Get one at{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    platform.openai.com
                  </a>
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-background rounded-lg p-4 border border-gray-800">
                <h3 className="text-sm font-medium text-text-primary mb-3">Videos to analyze</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {videos.slice(0, 20).map(video => (
                    <div key={video.id} className="flex items-center gap-3">
                      <div className="relative w-16 h-9 rounded overflow-hidden flex-shrink-0">
                        <Image src={video.thumbnail} alt="" fill className="object-cover" />
                      </div>
                      <span className="text-sm text-text-secondary truncate">{video.title}</span>
                    </div>
                  ))}
                  {videos.length > 20 && (
                    <p className="text-sm text-text-secondary">+ {videos.length - 20} more videos</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <svg className="w-8 h-8 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mt-6 mb-2">Analyzing videos with AI...</h3>
              <p className="text-sm text-text-secondary">This may take a moment</p>
            </div>
          )}

          {step === 'results' && result && (
            <div className="space-y-6">
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-400 mb-2">Analysis Complete</h3>
                <p className="text-sm text-text-secondary">{result.summary}</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-text-primary">
                  Suggested Courses ({result.courses.length})
                </h3>

                {result.courses.map((course, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      selectedCourses.has(index)
                        ? 'border-purple-500 bg-purple-900/10'
                        : 'border-gray-800 bg-background'
                    }`}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleCourseSelection(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedCourses.has(index)}
                              onChange={() => toggleCourseSelection(index)}
                              className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                            />
                            <h4 className="font-medium text-text-primary">{course.title}</h4>
                          </div>
                          <p className="text-sm text-text-secondary mt-2 ml-8">{course.description}</p>
                          <div className="flex items-center gap-4 mt-3 ml-8">
                            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                              {course.category}
                            </span>
                            <span className="px-2 py-1 bg-gray-800 text-text-secondary text-xs rounded">
                              {course.level}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {course.videos.length} videos
                            </span>
                            <span className="text-xs text-green-400">
                              {course.confidence}% confidence
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Videos in this course */}
                      <div className="mt-4 ml-8 space-y-2">
                        {course.videos.map(video => {
                          const fullVideo = videos.find(v => v.id === video.id);
                          return (
                            <div key={video.id} className="flex items-center gap-3 p-2 bg-background rounded">
                              {fullVideo && (
                                <div className="relative w-20 h-11 rounded overflow-hidden flex-shrink-0">
                                  <Image src={fullVideo.thumbnail} alt="" fill className="object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-text-primary truncate">{video.title}</p>
                                <p className="text-xs text-text-secondary truncate">{video.reason}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {result.ungroupedVideos.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-text-secondary mb-3">
                    Ungrouped Videos ({result.ungroupedVideos.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.ungroupedVideos.map(videoId => {
                      const video = videos.find(v => v.id === videoId);
                      return video ? (
                        <span key={videoId} className="px-2 py-1 bg-gray-800 text-text-secondary text-xs rounded">
                          {video.title.slice(0, 40)}...
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'creating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Creating Courses</h3>
              <p className="text-sm text-text-secondary mb-4">{creatingProgress.status}</p>
              <div className="w-full max-w-md bg-background rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(creatingProgress.current / creatingProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {creatingProgress.current} / {creatingProgress.total}
              </p>

              {createdCourses.length > 0 && (
                <div className="mt-6 w-full max-w-md">
                  <h4 className="text-sm font-medium text-text-primary mb-2">Created:</h4>
                  <ul className="space-y-1">
                    {createdCourses.map((title, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-green-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {step === 'creating' && creatingProgress.current === creatingProgress.total ? 'Done' : 'Cancel'}
          </button>

          {step === 'config' && (
            <button
              onClick={handleAnalyze}
              disabled={!apiKey}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze with AI
            </button>
          )}

          {step === 'results' && (
            <button
              onClick={handleCreateCourses}
              disabled={selectedCourses.size === 0}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-md font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create {selectedCourses.size} Course{selectedCourses.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
