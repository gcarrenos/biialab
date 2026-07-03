'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Minimal typings for the pieces of the IFrame API we use — avoids pulling
// in @types/youtube for one component.
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let iframeApiPromise: Promise<YTNamespace> | null = null;
function loadIframeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!iframeApiPromise) {
    iframeApiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT!);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    });
  }
  return iframeApiPromise;
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const SAVE_INTERVAL_MS = 10_000;
const RESUME_THRESHOLD_SECONDS = 30;

interface LessonPlayerProps {
  videoId: string;
  title?: string;
  /** Last saved playback position; shows the resume overlay when > 30s. */
  initialSeconds?: number;
  /** Called with the current position every ~10s while playing, and on pause/end/unmount. */
  onProgress?: (seconds: number, duration: number) => void;
  /** Called once when the user starts the video (play or resume). */
  onStart?: () => void;
  className?: string;
}

export function LessonPlayer({
  videoId,
  title = 'YouTube Video',
  initialSeconds = 0,
  onProgress,
  onStart,
  className = '',
}: LessonPlayerProps) {
  const [startAt, setStartAt] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const canResume = initialSeconds > RESUME_THRESHOLD_SECONDS;

  const begin = (seconds: number) => {
    onStart?.();
    setStartAt(seconds);
  };

  useEffect(() => {
    if (startAt === null || !containerRef.current) return;
    let cancelled = false;

    const reportProgress = () => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const seconds = player.getCurrentTime();
        const duration = player.getDuration();
        if (seconds > 0) onProgressRef.current?.(seconds, duration);
      } catch {
        // Player disposed mid-call; nothing to report.
      }
    };

    const stopSaving = () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };

    loadIframeApi().then((YT) => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          start: Math.floor(startAt),
          rel: 0, // related videos limited to the same channel
          iv_load_policy: 3, // no annotations/cards overlay
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (event: { data: number }) => {
            if (event.data === YT.PlayerState.PLAYING) {
              stopSaving();
              saveTimerRef.current = setInterval(reportProgress, SAVE_INTERVAL_MS);
            } else {
              stopSaving();
              if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                reportProgress();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      reportProgress();
      stopSaving();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, startAt]);

  // Thumbnail gate: nothing loads (and no YouTube widgets appear) until the
  // user picks where to start.
  if (startAt === null) {
    return (
      <div className={`relative aspect-video bg-black group ${className}`}>
        <Image
          src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
          {canResume ? (
            <>
              <button
                onClick={() => begin(Math.max(0, initialSeconds - 3))}
                className="flex items-center gap-3 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Continuar desde {formatTime(initialSeconds)}
              </button>
              <button
                onClick={() => begin(0)}
                className="px-4 py-2 text-sm text-white/90 hover:text-white underline underline-offset-4"
              >
                Empezar de nuevo
              </button>
            </>
          ) : (
            <button
              onClick={() => begin(0)}
              aria-label={`Reproducir ${title}`}
              className="w-20 h-14 bg-accent rounded-xl flex items-center justify-center hover:bg-accent/90 transition-colors shadow-lg"
            >
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
          <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
        </div>
      </div>
    );
  }

  return (
    // The IFrame API replaces the inner div with the player iframe, dropping
    // its classes — so the iframe is sized from the wrapper instead.
    <div className={`relative aspect-video bg-black [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:w-full [&_iframe]:h-full ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}
