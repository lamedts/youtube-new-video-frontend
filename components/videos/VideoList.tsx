'use client'

import { useGetVideosQuery } from '@/lib/redux/api/videosApi'
import { useAppSelector } from '@/lib/redux/hooks'
import VideoRow from './VideoRow'
import { Loader2 } from 'lucide-react'

export default function VideoList() {
  const { filters } = useAppSelector(state => state.videos)
  const { 
    data: videos = [], 
    isLoading, 
    error 
  } = useGetVideosQuery(filters)

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

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <VideoRow key={video.video_id} video={video} />
      ))}
    </div>
  )
}