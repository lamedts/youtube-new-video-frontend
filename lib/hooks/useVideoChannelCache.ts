/**
 * React hook for video-channel caching integration
 *
 * Provides:
 * - Smart batch fetching with cache awareness
 * - Loading states and error handling
 * - Integration with existing Redux patterns
 * - Automatic cache invalidation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { VideoWithChannel, Channel, CacheStats } from '@/types'
import { getVideoChannelCache } from '@/lib/cache/video-channel-cache'

// Ensure this only runs on client side
const isClient = typeof window !== 'undefined'

interface UseVideoCacheOptions {
  prefetch?: boolean
  maxAge?: number
  autoInvalidate?: boolean
}

interface UseVideoCacheResult {
  videos: VideoWithChannel[]
  loading: boolean
  error: string | null
  cacheStats: CacheStats | null
  refetch: () => Promise<void>
  invalidate: (videoIds?: string[]) => void
}

export function useVideoChannelCache(
  videoIds: string[],
  options: UseVideoCacheOptions = {}
): UseVideoCacheResult {
  const {
    prefetch = false,
    maxAge = 300,
    autoInvalidate = true
  } = options

  const [videos, setVideos] = useState<VideoWithChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)

  const cache = getVideoChannelCache()
  const abortControllerRef = useRef<AbortController | null>(null)
  const videoIdsRef = useRef<string[]>([])

  // Track videoIds changes
  const videoIdsChanged = JSON.stringify(videoIds) !== JSON.stringify(videoIdsRef.current)
  if (videoIdsChanged) {
    videoIdsRef.current = videoIds
  }

  const fetchVideos = useCallback(async () => {
    if (videoIds.length === 0) {
      setVideos([])
      setLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const fetchedVideos = await cache.getVideos(videoIds)
      const stats = cache.getStats()

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setVideos(fetchedVideos)
      setCacheStats(stats)
      setError(null)
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch videos'
      setError(errorMessage)
      console.error('Video cache fetch error:', err)
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false)
      }
    }
  }, [videoIds, cache])

  const invalidate = useCallback((targetVideoIds?: string[]) => {
    const idsToInvalidate = targetVideoIds || videoIds
    idsToInvalidate.forEach(id => cache.invalidateVideo(id))

    // Refetch if invalidating current videos
    if (!targetVideoIds || targetVideoIds.some(id => videoIds.includes(id))) {
      fetchVideos()
    }
  }, [videoIds, cache, fetchVideos])

  // Fetch videos when videoIds change
  useEffect(() => {
    if (videoIdsChanged) {
      fetchVideos()
    }
  }, [videoIdsChanged, fetchVideos])

  // Prefetch on mount if enabled
  useEffect(() => {
    if (prefetch && videoIds.length > 0) {
      cache.prefetchVideos(videoIds)
    }
  }, [prefetch, videoIds, cache])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    videos,
    loading,
    error,
    cacheStats,
    refetch: fetchVideos,
    invalidate
  }
}

/**
 * Hook for managing individual video with channel data
 */
export function useVideoWithChannel(
  videoId: string | null,
  options: UseVideoCacheOptions = {}
): {
  video: VideoWithChannel | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const result = useVideoChannelCache(
    videoId ? [videoId] : [],
    options
  )

  return {
    video: result.videos[0] || null,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch
  }
}

/**
 * Hook for channel data with caching
 */
export function useChannelCache(channelId: string): {
  channel: Channel | null
  loading: boolean
  setCachedChannel: (channel: Channel) => void
} {
  const [channel, setChannel] = useState<Channel | null>(null)
  const [loading, setLoading] = useState(false)

  const cache = getVideoChannelCache()

  useEffect(() => {
    if (!channelId) {
      setChannel(null)
      return
    }

    setLoading(true)
    const cachedChannel = cache.getChannel(channelId)

    if (cachedChannel) {
      setChannel(cachedChannel)
      setLoading(false)
    } else {
      // Channel not in cache - this hook doesn't fetch,
      // it only provides cached data
      setChannel(null)
      setLoading(false)
    }
  }, [channelId, cache])

  const setCachedChannel = useCallback((channelData: Channel) => {
    cache.setChannel(channelId, channelData)
    setChannel(channelData)
  }, [channelId, cache])

  return {
    channel,
    loading,
    setCachedChannel
  }
}

/**
 * Hook for cache statistics and management
 */
export function useCacheManagement(): {
  stats: ReturnType<ReturnType<typeof getVideoChannelCache>['getStats']>
  clearCache: () => void
  invalidateChannel: (channelId: string) => void
  prefetchVideos: (videoIds: string[]) => Promise<void>
} {
  const [stats, setStats] = useState(() =>
    isClient ? getVideoChannelCache().getStats() : {
      totalReads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      channelsFetched: 0,
      videosFetched: 0,
      video: { size: 0, hits: 0, memory: 0 },
      channel: { size: 0, hits: 0, memory: 0 }
    }
  )
  const cache = isClient ? getVideoChannelCache() : null

  // Update stats periodically
  useEffect(() => {
    if (!cache) return

    const interval = setInterval(() => {
      setStats(cache.getStats())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [cache])

  const clearCache = useCallback(() => {
    if (!cache) return
    cache.clear()
    setStats(cache.getStats())
  }, [cache])

  const invalidateChannel = useCallback((channelId: string) => {
    if (!cache) return
    cache.invalidateChannel(channelId)
    setStats(cache.getStats())
  }, [cache])

  const prefetchVideos = useCallback(async (videoIds: string[]) => {
    if (!cache) return
    await cache.prefetchVideos(videoIds)
    setStats(cache.getStats())
  }, [cache])

  return {
    stats,
    clearCache,
    invalidateChannel,
    prefetchVideos
  }
}