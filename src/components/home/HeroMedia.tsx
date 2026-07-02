'use client';

import { useEffect, useRef, useState } from 'react';

// Curated Pexels assets (chosen via the Pexels API at build time; URLs are
// stable CDN links — the API key is never shipped to the client).
// PLACEHOLDER_PEXELS: values injected by the curation step.
const HERO_POSTER = 'https://images.pexels.com/videos/34992913/pexels-photo-34992913.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200';
const HERO_VIDEO_MP4 = 'https://videos.pexels.com/video-files/34992913/14825278_1280_720_30fps.mp4';

/**
 * Ambient hero background: poster image paints immediately (LCP-safe),
 * the video lazy-loads after mount and cross-fades in. Muted, looped,
 * playsInline; respects prefers-reduced-motion by never starting playback.
 */
export function HeroMedia() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const video = videoRef.current;
    if (!video) return;
    video.src = HERO_VIDEO_MP4;
    video.load();
    const onCanPlay = () => {
      video.play().then(() => setVideoReady(true)).catch(() => {});
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
    return () => video.removeEventListener('canplay', onCanPlay);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative full-bleed poster; next/image adds no value for a fixed CDN asset */}
      <img
        src={HERO_POSTER}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background" />
    </div>
  );
}
