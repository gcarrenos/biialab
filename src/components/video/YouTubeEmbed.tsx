'use client';

import { useState } from 'react';
import Image from 'next/image';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  thumbnail?: string;
  autoplay?: boolean;
  showControls?: boolean;
  showRelated?: boolean;
  startTime?: number;
  className?: string;
}

export function YouTubeEmbed({
  videoId,
  title = 'YouTube Video',
  thumbnail,
  autoplay = false,
  showControls = true,
  showRelated = false,
  startTime,
  className = '',
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(autoplay);

  // Build embed URL with parameters
  const embedParams = new URLSearchParams({
    autoplay: isLoaded ? '1' : '0',
    controls: showControls ? '1' : '0',
    rel: showRelated ? '1' : '0',
    modestbranding: '1',
    playsinline: '1',
  });

  if (startTime) {
    embedParams.set('start', String(startTime));
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`;
  const thumbnailUrl = thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  // Lazy load - show thumbnail until clicked
  if (!isLoaded) {
    return (
      <div
        className={`relative aspect-video bg-black cursor-pointer group ${className}`}
        onClick={() => setIsLoaded(true)}
      >
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-14 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-lg">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p className="text-white text-sm font-medium line-clamp-2">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video bg-black ${className}`}>
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

// Smaller embed for cards/previews
export function YouTubeThumbnail({
  videoId,
  title = 'YouTube Video',
  thumbnail,
  duration,
  onClick,
  className = '',
}: {
  videoId: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  onClick?: () => void;
  className?: string;
}) {
  const thumbnailUrl = thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <div
      className={`relative aspect-video bg-black cursor-pointer group overflow-hidden rounded-lg ${className}`}
      onClick={onClick}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-transform group-hover:scale-105"
        sizes="(max-width: 768px) 100vw, 320px"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {/* Duration badge */}
      {duration && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
          {duration}
        </div>
      )}
    </div>
  );
}

// Full video player with info
export function YouTubePlayer({
  videoId,
  title,
  description,
  thumbnail,
  channelTitle,
  viewCount,
  likeCount,
  publishedAt,
  autoplay = false,
}: {
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelTitle?: string;
  viewCount?: number;
  likeCount?: number;
  publishedAt?: string;
  autoplay?: boolean;
}) {
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="space-y-4">
      {/* Video embed */}
      <YouTubeEmbed
        videoId={videoId}
        title={title}
        thumbnail={thumbnail}
        autoplay={autoplay}
        className="rounded-lg overflow-hidden"
      />

      {/* Video info */}
      <div>
        <h1 className="text-xl font-bold text-text-primary">{title}</h1>
        
        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
          {viewCount !== undefined && (
            <span>{formatCount(viewCount)} views</span>
          )}
          {likeCount !== undefined && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {formatCount(likeCount)}
            </span>
          )}
          {publishedAt && (
            <span>
              {new Date(publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Channel */}
        {channelTitle && (
          <p className="text-sm text-text-primary font-medium mt-2">{channelTitle}</p>
        )}

        {/* Description */}
        {description && (
          <div className="mt-4 p-4 bg-background-light rounded-lg">
            <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-4">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
