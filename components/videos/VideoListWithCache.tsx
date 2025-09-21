/**
 * Enhanced VideoList component with batch fetching and caching
 *
 * This component demonstrates the new DocumentReference + Cache system
 * while maintaining compatibility with the existing Redux video management.
 *
 * Features:
 * - Batch fetches video+channel data in single API calls
 * - Smart caching with LRU eviction and TTL
 * - Graceful fallback to individual VideoRow channel lookups
 * - Performance monitoring and cache statistics
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGetVideosQuery } from '@/lib/redux/api/videosApi'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setVideos, appendVideos, setLoadingMore } from '@/lib/redux/slices/videosSlice'
import { useVideoChannelCache, useCacheManagement } from '@/lib/hooks/useVideoChannelCache'
import { VideoWithChannel } from '@/types'
import VideoRow from './VideoRow'
import { Loader2, Database, TrendingUp } from 'lucide-react'

interface VideoListWithCacheProps {
  enableBatchFetching?: boolean
  showCacheStats?: boolean
}

export default function VideoListWithCache({
  enableBatchFetching = true,
  showCacheStats = false
}: VideoListWithCacheProps) {
  const dispatch = useAppDispatch()
  const { filters, items: videos, pagination, loadingMore } = useAppSelector(state => state.videos)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [videosWithChannels, setVideosWithChannels] = useState<VideoWithChannel[]>([])

  // Cache management
  const { stats, clearCache } = useCacheManagement()

  // Initial load using traditional method
  const {
    data: initialData,
    isLoading,
    error
  } = useGetVideosQuery({ ...filters, page: 1, limit: 20 })

  // Batch fetch videos with channels using our new cache system
  const videoIds = videos.map(v => v.video_id)
  const {
    videos: cachedVideosWithChannels,
    loading: cacheLoading,
    error: cacheError,
    cacheStats
  } = useVideoChannelCache(videoIds, {
    prefetch: enableBatchFetching
  })

  // Update Redux state when initial data loads
  useEffect(() => {
    if (initialData) {
      console.log('Initial data loaded:', {
        videosCount: initialData.videos?.length,
        total: initialData.total,
        currentPage: 1,
        enableBatchFetching
      })
      dispatch(setVideos(initialData.videos))
      setCurrentPage(1)
    }
  }, [initialData, dispatch, enableBatchFetching])

  // Update enhanced videos when cache data loads
  useEffect(() => {
    if (enableBatchFetching && cachedVideosWithChannels.length > 0) {
      setVideosWithChannels(cachedVideosWithChannels)
      console.log('Cached videos with channels loaded:', {
        count: cachedVideosWithChannels.length,
        cacheStats: cacheStats
      })
    }
  }, [cachedVideosWithChannels, enableBatchFetching, cacheStats])

  // Calculate if has more pages
  const totalVideos = initialData?.total || 0
  const videosPerPage = 20
  const hasMore = currentPage * videosPerPage < totalVideos

  // Load more function with optional batch enhancement
  const loadMore = useCallback(async () => {
    console.log('Load more triggered:', {
      currentPage,
      hasMore,
      loadingMore,
      totalVideos,
      enableBatchFetching
    })

    if (!hasMore || loadingMore) return

    const nextPage = currentPage + 1
    console.log('Load more proceeding for page:', nextPage)
    dispatch(setLoadingMore(true))

    try {
      const response = await fetch(`/api/videos?${new URLSearchParams({
        ...filters,
        page: nextPage.toString(),
        limit: videosPerPage.toString()
      } as any)}`)

      const data = await response.json()

      if (data.videos) {
        dispatch(appendVideos(data.videos))
        setCurrentPage(nextPage)

        // If batch fetching is enabled, the useVideoChannelCache hook
        // will automatically fetch channel data for the new videos
      }
    } catch (error) {
      console.error('Failed to load more videos:', error)
    } finally {
      dispatch(setLoadingMore(false))
    }
  }, [currentPage, hasMore, loadingMore, totalVideos, filters, dispatch, enableBatchFetching])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !loadingMore && hasMore) {
          loadMore()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loadingMore, currentPage, loadMore])

  // Cache statistics component
  const CacheStatsDisplay = () => {
    if (!showCacheStats) return null

    const efficiency = stats.totalReads > 0
      ? ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1)
      : '0'

    return (
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Cache Performance
            </span>
          </div>
          <button
            onClick={clearCache}
            className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
          >
            Clear Cache
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="text-blue-700 dark:text-blue-300">
            <div className="font-medium">Cache Hits</div>
            <div>{stats.cacheHits}</div>
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            <div className="font-medium">Efficiency</div>
            <div>{efficiency}%</div>
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            <div className="font-medium">Firebase Reads</div>
            <div>{stats.totalReads}</div>
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            <div className="font-medium">Cache Size</div>
            <div>V:{stats.video?.size || 0} C:{stats.channel?.size || 0}</div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading videos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200 text-center">
          Failed to load videos. Please try again later.
        </p>
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No videos found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      </div>
    )
  }

  // Determine which videos to render
  const videosToRender = enableBatchFetching && videosWithChannels.length > 0
    ? videosWithChannels
    : videos

  const renderingMode = enableBatchFetching && videosWithChannels.length > 0
    ? 'Enhanced (with cached channels)'
    : 'Legacy (individual channel lookups)'

  console.log('VideoListWithCache render:', {
    videosCount: videos.length,
    videosWithChannelsCount: videosWithChannels.length,
    hasMore,
    currentPage,
    totalVideos,
    loadingMore,
    renderingMode,
    cacheLoading
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <CacheStatsDisplay />

      {/* Performance indicator */}
      {enableBatchFetching && (
        <div className="mb-2 flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
          <TrendingUp className="h-3 w-3" />
          <span>Enhanced mode: {renderingMode}</span>
          {cacheLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
      )}

      <div className="space-y-4 pb-4">
        {videosToRender.map((video) => (
          <VideoRow
            key={video.video_id}
            video={video}
            // If we have enhanced video with channel, pass channel data directly
            channelData={enableBatchFetching && 'channel' in video ? video.channel : undefined}
          />
        ))}

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="flex items-center justify-center py-8"
          >
            {loadingMore ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Loading more videos...</span>
              </div>
            ) : (
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Load More Videos
              </button>
            )}
          </div>
        )}

        {/* End of results message */}
        {!hasMore && videos.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">You've reached the end!</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">No more videos to load</p>
            </div>
          </div>
        )}
      </div>

      {/* Cache error display */}
      {enableBatchFetching && cacheError && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            ⚠️ Cache system error: {cacheError}. Falling back to individual channel lookups.
          </p>
        </div>
      )}
    </div>
  )
}