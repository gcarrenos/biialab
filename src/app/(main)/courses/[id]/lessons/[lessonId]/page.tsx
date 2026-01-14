'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { courses as staticCourses, currentUser } from '@/lib/data';
import { Lesson, Module, Course, QuizQuestion } from '@/lib/types';
import { ChevronRightIcon, CheckCircleIcon, LockClosedIcon, ChevronLeftIcon, DocumentTextIcon, LinkIcon } from '@heroicons/react/24/outline';
import { getCourseBySlugOrId, CourseWithDetails } from '@/lib/db/actions/courses';
import { YouTubeEmbed } from '@/components/video/YouTubeEmbed';

interface LessonPageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default function LessonPage({ params }: LessonPageProps) {
  // Unwrap params using React.use()
  const { id, lessonId } = use(params);
  
  const [activeTab, setActiveTab] = useState<'video' | 'notes' | 'resources' | 'quiz'>('video');
  const [course, setCourse] = useState<Course | CourseWithDetails | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | CourseWithDetails['modules'][0]['lessons'][0] | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | CourseWithDetails['modules'][0] | null>(null);
  const [userProgress, setUserProgress] = useState<string[]>([]);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Find the current course, module, and lesson
  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      
      // Try database first
      const dbCourse = await getCourseBySlugOrId(id);
      
      if (dbCourse && dbCourse.modules.length > 0) {
        setCourse(dbCourse as any);
        
        // Find lesson in database course
        let foundLesson = null;
        let foundModule = null;
        
        for (const mod of dbCourse.modules) {
          const lesson = mod.lessons.find(l => l.id === lessonId);
          if (lesson) {
            foundLesson = lesson;
            foundModule = mod;
            break;
          }
        }
        
        if (foundLesson && foundModule) {
          setCurrentLesson(foundLesson as any);
          setCurrentModule(foundModule as any);
        }
        
        setIsLoading(false);
        return;
      }
      
      // Fallback to static data
      const foundCourse = staticCourses.find(c => c.id === id);
      if (!foundCourse || !foundCourse.modules) {
        setIsLoading(false);
        return;
      }
      
      setCourse(foundCourse);
      
      // Find the current module and lesson
      let foundLesson: Lesson | null = null;
      let foundModule: Module | null = null;
      
      foundCourse.modules.forEach(module => {
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) {
          foundLesson = lesson;
          foundModule = module;
        }
      });
      
      if (foundLesson && foundModule) {
        setCurrentLesson(foundLesson);
        setCurrentModule(foundModule);
      }
      
      // Get user progress
      const userCourseProgress = currentUser.progress.find(p => p.courseId === id);
      if (userCourseProgress && userCourseProgress.completedLessons) {
        setUserProgress(userCourseProgress.completedLessons);
      }
      
      setIsLoading(false);
    };
    
    fetchCourse();
  }, [id, lessonId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading lesson...</h2>
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!course || !currentLesson || !currentModule) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lesson not found</h2>
          <Link href={`/courses/${id}`} className="text-accent hover:underline">
            Back to course
          </Link>
        </div>
      </div>
    );
  }
  
  // Get modules array (works for both types)
  const modules = 'modules' in course ? course.modules : [];
  const courseSlug = 'slug' in course ? course.slug : course.id;
  const instructor = 'instructor' in course ? course.instructor : null;
  const duration = 'duration' in course ? course.duration : '';
  
  // Find previous and next lessons for navigation
  const findAdjacentLessons = () => {
    if (!modules || modules.length === 0) return { prevLesson: null, nextLesson: null };
    
    let prevLesson: { moduleId: string; lessonId: string } | null = null;
    let nextLesson: { moduleId: string; lessonId: string } | null = null;
    let foundCurrent = false;
    
    for (let m = 0; m < modules.length; m++) {
      const module = modules[m];
      const moduleLessons = 'lessons' in module ? module.lessons : [];
      
      for (let l = 0; l < moduleLessons.length; l++) {
        const lesson = moduleLessons[l];
        
        if (foundCurrent) {
          nextLesson = { moduleId: module.id, lessonId: lesson.id };
          break;
        }
        
        if (lesson.id === lessonId) {
          foundCurrent = true;
        } else {
          prevLesson = { moduleId: module.id, lessonId: lesson.id };
        }
      }
      
      if (nextLesson) break;
    }
    
    return { prevLesson, nextLesson };
  };
  
  const { prevLesson, nextLesson } = findAdjacentLessons();
  
  // Get lesson properties safely
  const lessonTitle = 'title' in currentLesson ? currentLesson.title : '';
  const lessonVideoUrl = 'videoUrl' in currentLesson ? currentLesson.videoUrl : null;
  const lessonYoutubeId = 'youtubeVideoId' in currentLesson ? currentLesson.youtubeVideoId : null;
  const lessonResources = 'resources' in currentLesson ? currentLesson.resources : [];
  const lessonQuizzes = 'quizzes' in currentLesson ? currentLesson.quizzes : [];
  const lessonDuration = 'duration' in currentLesson ? currentLesson.duration : '';
  
  // Handle quiz submission
  const handleQuizSubmit = () => {
    if (!lessonQuizzes || lessonQuizzes.length === 0) return;
    
    setQuizSubmitted(true);
    console.log("Quiz answers submitted:", selectedQuizAnswers);
  };
  
  // Calculate quiz score
  const calculateQuizScore = () => {
    if (!lessonQuizzes || lessonQuizzes.length === 0) return 0;
    
    const quiz = lessonQuizzes[0];
    let correctAnswers = 0;
    
    quiz.questions.forEach((question: QuizQuestion) => {
      if (selectedQuizAnswers[question.id] === question.correctOptionIndex) {
        correctAnswers++;
      }
    });
    
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };
  
  const isLessonCompleted = (lessonIdToCheck: string) => {
    return userProgress.includes(lessonIdToCheck);
  };
  
  return (
    <div className="bg-background min-h-screen text-text-primary">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-background-light border-r border-gray-800 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <Link href={`/courses/${courseSlug}`} className="flex items-center text-text-secondary hover:text-text-primary">
              <ChevronLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to course</span>
            </Link>
          </div>
          
          <div className="p-4">
            <h1 className="text-xl font-bold mb-1">{course.title}</h1>
            <p className="text-text-secondary text-sm mb-4">
              {instructor?.name || 'Instructor'} • {duration}
            </p>
            
            <div className="space-y-6">
              {modules.map((module, moduleIndex) => {
                const moduleLessons = 'lessons' in module ? module.lessons : [];
                
                return (
                  <div key={module.id} className="space-y-2">
                    <h3 className="font-medium text-md flex items-center">
                      <span className="mr-2">{moduleIndex + 1}.</span>
                      {module.title}
                    </h3>
                    
                    <ul className="space-y-2 pl-6">
                      {moduleLessons.map((lesson, lessonIndex) => {
                        const isCurrentLesson = lesson.id === lessonId;
                        const isLocked = 'isLocked' in lesson && lesson.isLocked && !isLessonCompleted(lesson.id);
                        
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={isLocked ? '#' : `/courses/${courseSlug}/lessons/${lesson.id}`}
                              className={`flex items-center py-2 px-3 rounded group transition-colors ${
                                isCurrentLesson 
                                  ? 'bg-accent text-white' 
                                  : isLocked 
                                    ? 'text-gray-500 cursor-not-allowed'
                                    : 'hover:bg-background-light hover:text-accent'
                              }`}
                            >
                              <div className="w-6 h-6 flex-shrink-0 mr-2">
                                {isLessonCompleted(lesson.id) ? (
                                  <CheckCircleIcon className={`w-5 h-5 ${isCurrentLesson ? 'text-white' : 'text-green-500'}`} />
                                ) : isLocked ? (
                                  <LockClosedIcon className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <div className={`w-5 h-5 rounded-full border ${isCurrentLesson ? 'border-white' : 'border-gray-600'} flex items-center justify-center text-xs`}>
                                    {moduleIndex + 1}.{lessonIndex + 1}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 truncate">
                                <span className={`${isLocked ? 'text-gray-500' : ''}`}>{lesson.title}</span>
                              </div>
                              {'duration' in lesson && lesson.duration && (
                                <span className="text-xs text-gray-500 ml-2">{lesson.duration}</span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Video player header */}
          <div className="bg-black p-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white truncate">{lessonTitle}</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1 rounded text-sm ${activeTab === 'video' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Video
              </button>
              <button 
                onClick={() => setActiveTab('resources')}
                className={`px-3 py-1 rounded text-sm ${activeTab === 'resources' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Resources
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className={`px-3 py-1 rounded text-sm ${activeTab === 'notes' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
              >
                Notes
              </button>
              {lessonQuizzes && lessonQuizzes.length > 0 && (
                <button 
                  onClick={() => setActiveTab('quiz')}
                  className={`px-3 py-1 rounded text-sm ${activeTab === 'quiz' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-300'}`}
                >
                  Quiz
                </button>
              )}
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'video' && (
              <div className="aspect-video bg-black relative">
                {lessonYoutubeId ? (
                  <YouTubeEmbed videoId={lessonYoutubeId} title={lessonTitle} />
                ) : lessonVideoUrl ? (
                  <video 
                    className="w-full h-full" 
                    controls 
                    src={lessonVideoUrl}
                    poster="https://picsum.photos/800/450?random=video"
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <p>No video available for this lesson</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'resources' && (
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Resources</h3>
                {lessonResources && lessonResources.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {lessonResources.map((resource: any) => (
                      <div key={resource.id} className="bg-background-light rounded-lg p-4 flex items-start">
                        <div className="mr-4 mt-1">
                          {resource.type === 'pdf' ? (
                            <DocumentTextIcon className="h-8 w-8 text-accent" />
                          ) : resource.type === 'link' ? (
                            <LinkIcon className="h-8 w-8 text-accent" />
                          ) : (
                            <DocumentTextIcon className="h-8 w-8 text-accent" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-lg">{resource.title}</h4>
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-accent hover:underline"
                          >
                            {resource.type === 'pdf' ? 'Download PDF' : 'View Resource'}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary">No resources available for this lesson.</p>
                )}
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="p-6">
                <h3 className="text-xl font-bold mb-6">Notes</h3>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  className="w-full h-64 p-4 bg-background-light border border-gray-800 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Add your notes for this lesson here..."
                ></textarea>
                <button 
                  className="mt-4 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
                >
                  Save Notes
                </button>
              </div>
            )}
            
            {activeTab === 'quiz' && lessonQuizzes && lessonQuizzes.length > 0 && (
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{lessonQuizzes[0].title}</h3>
                <p className="text-text-secondary mb-6">Test your knowledge from this lesson</p>
                
                {quizSubmitted ? (
                  <div className="bg-background-light p-6 rounded-lg">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-accent mb-2">{calculateQuizScore()}%</div>
                      <p className="text-text-secondary">
                        {calculateQuizScore() >= 70 ? 'Great job!' : 'Keep studying and try again!'}
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      {lessonQuizzes[0].questions.map((question: QuizQuestion) => (
                        <div key={question.id} className="border-b border-gray-800 pb-6">
                          <p className="font-medium text-text-primary mb-3">{question.question}</p>
                          <div className="space-y-2">
                            {question.options.map((option, idx) => {
                              const isSelected = selectedQuizAnswers[question.id] === idx;
                              const isCorrect = question.correctOptionIndex === idx;
                              
                              let bgClass = 'bg-background';
                              if (isSelected && isCorrect) bgClass = 'bg-green-900/20';
                              else if (isSelected && !isCorrect) bgClass = 'bg-red-900/20';
                              else if (isCorrect) bgClass = 'bg-green-900/20';
                              
                              return (
                                <div 
                                  key={idx} 
                                  className={`p-3 rounded-md ${bgClass} border ${
                                    isSelected && isCorrect ? 'border-green-500' : 
                                    isSelected && !isCorrect ? 'border-red-500' : 
                                    isCorrect ? 'border-green-500' : 'border-gray-800'
                                  }`}
                                >
                                  {option}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setQuizSubmitted(false)}
                      className="mt-6 w-full py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
                    >
                      Retry Quiz
                    </button>
                  </div>
                ) : (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleQuizSubmit();
                    }}
                    className="space-y-6"
                  >
                    {lessonQuizzes[0].questions.map((question: QuizQuestion, qIndex: number) => (
                      <div key={question.id} className="bg-background-light p-6 rounded-lg">
                        <p className="font-medium text-text-primary mb-4">
                          {qIndex + 1}. {question.question}
                        </p>
                        <div className="space-y-3">
                          {question.options.map((option, idx) => (
                            <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-800 rounded-md cursor-pointer hover:bg-background transition-colors">
                              <input
                                type="radio"
                                name={question.id}
                                value={idx}
                                checked={selectedQuizAnswers[question.id] === idx}
                                onChange={() => {
                                  setSelectedQuizAnswers({
                                    ...selectedQuizAnswers,
                                    [question.id]: idx
                                  });
                                }}
                                className="h-4 w-4 text-accent focus:ring-accent border-gray-600 bg-transparent"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      type="submit"
                      className="w-full py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors"
                    >
                      Submit Quiz
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation footer */}
          <div className="bg-background-light border-t border-gray-800 p-4 flex justify-between">
            {prevLesson ? (
              <Link 
                href={`/courses/${courseSlug}/lessons/${prevLesson.lessonId}`}
                className="flex items-center text-text-secondary hover:text-text-primary"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" />
                <span>Previous Lesson</span>
              </Link>
            ) : (
              <div></div>
            )}
            
            {nextLesson ? (
              <Link 
                href={`/courses/${courseSlug}/lessons/${nextLesson.lessonId}`}
                className="flex items-center text-text-secondary hover:text-text-primary ml-auto"
              >
                <span>Next Lesson</span>
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </Link>
            ) : (
              <Link 
                href={`/courses/${courseSlug}`}
                className="flex items-center text-text-secondary hover:text-text-primary ml-auto"
              >
                <span>Complete Course</span>
                <CheckCircleIcon className="h-5 w-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
