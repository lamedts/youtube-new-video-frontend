'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGetVideosQuery } from '@/lib/redux/api/videosApi'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setVideos, appendVideos, setPaginationState, setLoadingMore } from '@/lib/redux/slices/videosSlice'
import VideoRow from './VideoRow'
import { Loader2 } from 'lucide-react'

export default function VideoList() {
  const dispatch = useAppDispatch()
  const { filters, items: videos, pagination, loadingMore } = useAppSelector(state => state.videos)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Initial load
  const { 
    data: initialData, 
    isLoading, 
    error 
  } = useGetVideosQuery({ ...filters, page: 1, limit: 20 })

  // Update Redux state when initial data loads
  useEffect(() => {
    if (initialData) {
      console.log('Initial data loaded:', {
        videosCount: initialData.videos?.length,
        total: initialData.total,
        currentPage: 1
      })
      dispatch(setVideos(initialData.videos))
      setCurrentPage(1)
    }
  }, [initialData, dispatch])

  // Calculate if has more pages
  const totalVideos = initialData?.total || 0
  const videosPerPage = 20
  const hasMore = currentPage * videosPerPage < totalVideos

  // Load more function
  const loadMore = useCallback(async () => {
    console.log('Load more triggered:', { currentPage, hasMore, loadingMore, totalVideos })
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
      }
    } catch (error) {
      console.error('Failed to load more videos:', error)
    } finally {
      dispatch(setLoadingMore(false))
    }
  }, [currentPage, hasMore, loadingMore, totalVideos, filters, dispatch])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    console.log('Intersection observer useEffect triggered:', { hasMore, loadingMore })
    if (!hasMore || loadingMore) {
      console.log('Intersection observer setup skipped due to conditions')
      return
    }

    console.log('Creating intersection observer...')
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        console.log('Intersection observed:', { 
          isIntersecting: target.isIntersecting, 
          loadingMore, 
          hasMore,
          currentPage
        })
        if (target.isIntersecting && !loadingMore && hasMore) {
          console.log('Triggering loadMore from intersection observer')
          loadMore()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    if (loadMoreRef.current) {
      console.log('Observer attached to loadMoreRef element')
      observer.observe(loadMoreRef.current)
    } else {
      console.log('loadMoreRef.current is null, observer not attached')
    }

    return () => {
      console.log('Intersection observer cleanup')
      observer.disconnect()
    }
  }, [hasMore, loadingMore, currentPage, loadMore])

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

  console.log('VideoList render:', { 
    videosCount: videos.length, 
    hasMore, 
    currentPage, 
    totalVideos,
    loadingMore
  })

  return (
    <div className="space-y-4 pb-4">
      {videos.map((video) => (
        <VideoRow key={video.video_id} video={video} />
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
  )
}