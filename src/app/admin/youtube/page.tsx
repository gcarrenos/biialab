'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  getAllChannelVideos,
  getChannelInfo,
  sortVideos,
  filterVideos,
  calculateVideoStats,
  formatViewCount,
  formatPublishedDate,
  timeAgo,
  SortOption,
  VideoFilters,
} from '@/lib/youtube';
import { YouTubeVideo, YouTubeChannel } from '@/lib/types';
import { ImportCourseModal } from '@/components/admin/ImportCourseModal';

type ViewMode = 'grid' | 'list' | 'stats';

// Environment variables for YouTube API
const ENV_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || '';
const ENV_CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || '';

// Cache configuration
const CACHE_KEY = 'youtube_dashboard_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  timestamp: number;
  channelId: string;
}

// Cache utility functions
const getCache = (channelId: string): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    const now = Date.now();
    const age = now - data.timestamp;
    
    // Check if cache is for the same channel and not expired
    if (data.channelId === channelId && age < CACHE_DURATION_MS) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

const setCache = (channelId: string, channel: YouTubeChannel, videos: YouTubeVideo[]): void => {
  try {
    const data: CachedData = {
      channel,
      videos,
      timestamp: Date.now(),
      channelId,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to cache YouTube data:', err);
  }
};

const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
};

const formatCacheAge = (timestamp: number): string => {
  const age = Date.now() - timestamp;
  const minutes = Math.floor(age / (1000 * 60));
  const hours = Math.floor(age / (1000 * 60 * 60));
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return 'over 24h ago';
};

export default function YouTubeDashboard() {
  // API Configuration - prefer env vars, fallback to localStorage
  const [apiKey, setApiKey] = useState(ENV_API_KEY);
  const [channelId, setChannelId] = useState(ENV_CHANNEL_ID);
  const [isConfigured, setIsConfigured] = useState(!!ENV_API_KEY && !!ENV_CHANNEL_ID);
  const [useEnvVars, setUseEnvVars] = useState(!!ENV_API_KEY && !!ENV_CHANNEL_ID);

  // Data states
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // Cache state
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // UI states
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filters
  const [filters, setFilters] = useState<VideoFilters>({});

  // Import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Load saved config from localStorage (only if env vars not set)
  useEffect(() => {
    if (!ENV_API_KEY || !ENV_CHANNEL_ID) {
      const savedApiKey = localStorage.getItem('youtube_api_key');
      const savedChannelId = localStorage.getItem('youtube_channel_id');
      if (savedApiKey && savedChannelId) {
        setApiKey(savedApiKey);
        setChannelId(savedChannelId);
        setIsConfigured(true);
        setUseEnvVars(false);
      }
    }
  }, []);

  // Save config to localStorage
  const saveConfig = () => {
    localStorage.setItem('youtube_api_key', apiKey);
    localStorage.setItem('youtube_channel_id', channelId);
    setIsConfigured(true);
    setUseEnvVars(false);
    setError(null);
  };

  // Clear config
  const clearConfig = () => {
    if (!useEnvVars) {
      localStorage.removeItem('youtube_api_key');
      localStorage.removeItem('youtube_channel_id');
    }
    clearCache();
    setApiKey(ENV_API_KEY);
    setChannelId(ENV_CHANNEL_ID);
    setIsConfigured(!!ENV_API_KEY && !!ENV_CHANNEL_ID);
    setUseEnvVars(!!ENV_API_KEY && !!ENV_CHANNEL_ID);
    setChannel(null);
    setVideos([]);
    setCacheTimestamp(null);
    setIsFromCache(false);
  };

  // Auto-load videos when configured
  useEffect(() => {
    if (isConfigured && videos.length === 0 && !isLoading) {
      fetchVideos();
    }
  }, [isConfigured, videos.length, isLoading, fetchVideos]);

  // Fetch videos (with caching)
  const fetchVideos = useCallback(async (forceRefresh = false) => {
    if (!apiKey || !channelId) {
      setError('Please provide API Key and Channel ID');
      return;
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCache(channelId);
      if (cached) {
        setChannel(cached.channel);
        setVideos(cached.videos);
        setCacheTimestamp(cached.timestamp);
        setIsFromCache(true);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress({ loaded: 0, total: 0 });
    setIsFromCache(false);

    try {
      // Fetch channel info
      const channelInfo = await getChannelInfo(apiKey, channelId);
      setChannel(channelInfo);

      // Fetch all videos
      const allVideos = await getAllChannelVideos(apiKey, channelId, (loaded, total) => {
        setLoadingProgress({ loaded, total });
      });

      setVideos(allVideos);
      
      // Cache the results
      setCache(channelId, channelInfo, allVideos);
      setCacheTimestamp(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, channelId]);

  // Force refresh (bypass cache)
  const forceRefresh = () => {
    clearCache();
    fetchVideos(true);
  };

  // Processed videos with filters and sorting
  const processedVideos = useMemo(() => {
    let result = [...videos];

    // Apply search filter
    if (searchQuery) {
      result = filterVideos(result, { ...filters, searchQuery });
    } else if (Object.keys(filters).length > 0) {
      result = filterVideos(result, filters);
    }

    // Apply sorting
    result = sortVideos(result, sortBy);

    return result;
  }, [videos, searchQuery, filters, sortBy]);

  // Calculate stats
  const stats = useMemo(() => calculateVideoStats(processedVideos), [processedVideos]);

  // Toggle video selection
  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedVideos);
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId);
    } else {
      newSelection.add(videoId);
    }
    setSelectedVideos(newSelection);
  };

  // Select all visible videos
  const selectAll = () => {
    if (selectedVideos.size === processedVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(processedVideos.map(v => v.id)));
    }
  };

  // Import selected videos (placeholder - integrate with your course system)
  const importSelected = () => {
    if (selectedVideos.size > 0) {
      setShowImportModal(true);
    }
  };

  // Get selected video data for the modal
  const selectedVideoData = useMemo(() => 
    videos.filter(v => selectedVideos.has(v.id)),
    [videos, selectedVideos]
  );

  // Configuration Screen
  if (!isConfigured) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-text-primary">YouTube Dashboard</h1>

        <div className="max-w-2xl mx-auto">
          <div className="bg-background-light p-8 rounded-lg border border-gray-800">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-600/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Connect Your YouTube Channel</h2>
              <p className="text-text-secondary text-sm">
                Enter your YouTube API key and Channel ID to fetch your videos
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  YouTube API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <p className="mt-2 text-xs text-text-secondary">
                  Get your API key from{' '}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Channel ID
                </label>
                <input
                  type="text"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  placeholder="UC..."
                  className="w-full px-4 py-3 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <p className="mt-2 text-xs text-text-secondary">
                  Find your Channel ID in YouTube Studio → Settings → Advanced settings
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={saveConfig}
                disabled={!apiKey || !channelId}
                className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
              >
                Connect Channel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">YouTube Dashboard</h1>
          {channel && (
            <p className="text-text-secondary mt-1">
              {channel.title} • {formatViewCount(channel.videoCount)} videos
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Cache status indicator */}
          {isFromCache && cacheTimestamp && (
            <span className="px-3 py-2 bg-blue-900/30 border border-blue-800 rounded-md text-xs text-blue-400 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cached {formatCacheAge(cacheTimestamp)}
            </span>
          )}

          <button
            onClick={() => fetchVideos(false)}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading ({loadingProgress.loaded}/{loadingProgress.total})
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {videos.length > 0 ? 'Load' : 'Fetch Videos'}
              </>
            )}
          </button>

          {/* Force refresh button (bypasses cache) */}
          {videos.length > 0 && (
            <button
              onClick={forceRefresh}
              disabled={isLoading}
              className="px-4 py-2 bg-background hover:bg-gray-800 text-text-secondary hover:text-text-primary border border-gray-800 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Force refresh from YouTube API"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh API
            </button>
          )}

          {useEnvVars && (
            <span className="px-3 py-2 bg-green-900/30 border border-green-800 rounded-md text-xs text-green-400">
              Using .env config
            </span>
          )}
          <button
            onClick={clearConfig}
            className="px-4 py-2 bg-background hover:bg-gray-800 text-text-secondary hover:text-text-primary border border-gray-800 rounded-md text-sm font-medium transition-colors"
          >
            {useEnvVars ? 'Reset' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-md text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Channel Stats */}
      {channel && videos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Total Videos</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalVideos}</p>
          </div>
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Total Views</p>
            <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.totalViews)}</p>
          </div>
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Total Likes</p>
            <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.totalLikes)}</p>
          </div>
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Avg Views</p>
            <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.avgViews)}</p>
          </div>
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Avg Likes</p>
            <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.avgLikes)}</p>
          </div>
          <div className="bg-background-light p-4 rounded-lg border border-gray-800">
            <p className="text-xs text-text-secondary mb-1">Subscribers</p>
            <p className="text-2xl font-bold text-text-primary">{formatViewCount(channel.subscriberCount)}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {videos.length > 0 && (
        <div className="bg-background-light p-4 rounded-lg border border-gray-800 space-y-4">
          {/* Search and View Mode */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-gray-800 rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-secondary whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-background border border-gray-800 rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="views-desc">Most Views</option>
                <option value="views-asc">Least Views</option>
                <option value="likes-desc">Most Likes</option>
                <option value="likes-asc">Least Likes</option>
                <option value="comments-desc">Most Comments</option>
                <option value="comments-asc">Least Comments</option>
                <option value="duration-desc">Longest</option>
                <option value="duration-asc">Shortest</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center border border-gray-800 rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-background text-text-secondary hover:text-text-primary'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-background text-text-secondary hover:text-text-primary'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`p-2 ${viewMode === 'stats' ? 'bg-red-600 text-white' : 'bg-background text-text-secondary hover:text-text-primary'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-md transition-colors ${
                showFilters ? 'bg-red-600 border-red-600 text-white' : 'bg-background border-gray-800 text-text-secondary hover:text-text-primary'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Min Views</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.minViews || ''}
                  onChange={(e) => setFilters({ ...filters, minViews: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-background border border-gray-800 rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Max Views</label>
                <input
                  type="number"
                  placeholder="∞"
                  value={filters.maxViews || ''}
                  onChange={(e) => setFilters({ ...filters, maxViews: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-background border border-gray-800 rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Published After</label>
                <input
                  type="date"
                  value={filters.publishedAfter?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setFilters({ ...filters, publishedAfter: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 bg-background border border-gray-800 rounded-md text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>
          )}

          {/* Selection Actions */}
          {selectedVideos.size > 0 && (
            <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-text-secondary">
                  {selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedVideos(new Set())}
                  className="text-sm text-red-500 hover:underline"
                >
                  Clear selection
                </button>
              </div>
              <button
                onClick={importSelected}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Selected
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {videos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Showing {processedVideos.length} of {videos.length} videos
          </p>
          <button
            onClick={selectAll}
            className="text-sm text-red-500 hover:underline"
          >
            {selectedVideos.size === processedVideos.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}

      {/* Video Grid */}
      {viewMode === 'grid' && processedVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {processedVideos.map((video) => (
            <div
              key={video.id}
              className={`bg-background-light rounded-lg border overflow-hidden transition-all cursor-pointer ${
                selectedVideos.has(video.id) ? 'border-red-600 ring-2 ring-red-600/50' : 'border-gray-800 hover:border-gray-700'
              }`}
              onClick={() => toggleVideoSelection(video.id)}
            >
              <div className="relative aspect-video">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-medium">
                  {video.duration}
                </div>
                {selectedVideos.has(video.id) && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-text-primary text-sm line-clamp-2 mb-2">{video.title}</h3>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{formatViewCount(video.viewCount)} views</span>
                  <span>{timeAgo(video.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {formatViewCount(video.likeCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {formatViewCount(video.commentCount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video List */}
      {viewMode === 'list' && processedVideos.length > 0 && (
        <div className="bg-background-light rounded-lg border border-gray-800 overflow-hidden">
          <div className="grid grid-cols-12 bg-background p-3 border-b border-gray-800 text-xs font-medium text-text-secondary">
            <div className="col-span-1"></div>
            <div className="col-span-4">Video</div>
            <div className="col-span-1 text-right">Duration</div>
            <div className="col-span-2 text-right">Views</div>
            <div className="col-span-1 text-right">Likes</div>
            <div className="col-span-1 text-right">Comments</div>
            <div className="col-span-2 text-right">Published</div>
          </div>
          <div className="divide-y divide-gray-800">
            {processedVideos.map((video) => (
              <div
                key={video.id}
                className={`grid grid-cols-12 p-3 items-center cursor-pointer transition-colors ${
                  selectedVideos.has(video.id) ? 'bg-red-900/20' : 'hover:bg-background'
                }`}
                onClick={() => toggleVideoSelection(video.id)}
              >
                <div className="col-span-1">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedVideos.has(video.id) ? 'bg-red-600 border-red-600' : 'border-gray-600'
                    }`}
                  >
                    {selectedVideos.has(video.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary text-sm truncate">{video.title}</p>
                    <p className="text-xs text-text-secondary truncate">{video.description.slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="col-span-1 text-right text-sm text-text-secondary">{video.duration}</div>
                <div className="col-span-2 text-right text-sm text-text-primary font-medium">{formatViewCount(video.viewCount)}</div>
                <div className="col-span-1 text-right text-sm text-text-secondary">{formatViewCount(video.likeCount)}</div>
                <div className="col-span-1 text-right text-sm text-text-secondary">{formatViewCount(video.commentCount)}</div>
                <div className="col-span-2 text-right text-sm text-text-secondary">{formatPublishedDate(video.publishedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats View */}
      {viewMode === 'stats' && processedVideos.length > 0 && (
        <div className="space-y-6">
          {/* Top Performing Video */}
          {stats.topVideo && (
            <div className="bg-background-light p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-bold text-text-primary mb-4">Top Performing Video</h3>
              <div className="flex gap-6">
                <div className="relative w-80 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={stats.topVideo.thumbnailHigh}
                    alt={stats.topVideo.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-text-primary mb-2">{stats.topVideo.title}</h4>
                  <p className="text-text-secondary text-sm mb-4 line-clamp-2">{stats.topVideo.description}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-red-500">{formatViewCount(stats.topVideo.viewCount)}</p>
                      <p className="text-xs text-text-secondary">Views</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.topVideo.likeCount)}</p>
                      <p className="text-xs text-text-secondary">Likes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary">{formatViewCount(stats.topVideo.commentCount)}</p>
                      <p className="text-xs text-text-secondary">Comments</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`https://www.youtube.com/watch?v=${stats.topVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Watch on YouTube
                    </a>
                    <button
                      onClick={() => {
                        setSelectedVideos(new Set([stats.topVideo!.id]));
                        setShowImportModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      Import This Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 by Views */}
            <div className="bg-background-light p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-bold text-text-primary mb-4">Top 10 by Views</h3>
              <div className="space-y-3">
                {sortVideos(processedVideos, 'views-desc').slice(0, 10).map((video, index) => (
                  <div key={video.id} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-text-secondary w-6">{index + 1}</span>
                    <div className="relative w-16 h-9 rounded overflow-hidden flex-shrink-0">
                      <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{video.title}</p>
                    </div>
                    <span className="text-sm font-medium text-red-500">{formatViewCount(video.viewCount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 10 by Engagement (likes/views ratio) */}
            <div className="bg-background-light p-6 rounded-lg border border-gray-800">
              <h3 className="text-lg font-bold text-text-primary mb-4">Top 10 by Engagement</h3>
              <div className="space-y-3">
                {[...processedVideos]
                  .sort((a, b) => {
                    const engagementA = a.viewCount > 0 ? (a.likeCount / a.viewCount) : 0;
                    const engagementB = b.viewCount > 0 ? (b.likeCount / b.viewCount) : 0;
                    return engagementB - engagementA;
                  })
                  .slice(0, 10)
                  .map((video, index) => {
                    const engagement = video.viewCount > 0 ? ((video.likeCount / video.viewCount) * 100).toFixed(1) : '0';
                    return (
                      <div key={video.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-text-secondary w-6">{index + 1}</span>
                        <div className="relative w-16 h-9 rounded overflow-hidden flex-shrink-0">
                          <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{video.title}</p>
                        </div>
                        <span className="text-sm font-medium text-green-500">{engagement}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No videos loaded</h3>
          <p className="text-text-secondary text-sm mb-4">Click &quot;Fetch Videos&quot; to load your YouTube channel videos</p>
        </div>
      )}

      {/* No Results */}
      {videos.length > 0 && processedVideos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-primary mb-2">No videos match your filters</h3>
          <p className="text-text-secondary text-sm mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilters({});
            }}
            className="text-red-500 hover:underline text-sm"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Import Course Modal */}
      <ImportCourseModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedVideos(new Set()); // Clear selection after import
        }}
        selectedVideos={selectedVideoData}
        apiKey={apiKey}
      />
    </div>
  );
}
