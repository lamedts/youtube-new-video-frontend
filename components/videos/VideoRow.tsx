'use client'

import { useState } from 'react'
import { Eye, Star, Trash2, Play, Calendar, Volume2 } from 'lucide-react'
import { Video } from '@/types'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { openPlayer } from '@/lib/redux/slices/playerSlice'
import { useUpdateVideoClickMutation, useToggleVideoFavoriteMutation, useDeleteVideoMutation } from '@/lib/redux/api/videosApi'

interface VideoRowProps {
  video: Video
}

export default function VideoRow({ video }: VideoRowProps) {
  const dispatch = useAppDispatch()
  const { currentVideo, isOpen } = useAppSelector(state => state.player)
  const [updateVideoClick] = useUpdateVideoClickMutation()
  const [toggleVideoFavorite] = useToggleVideoFavoriteMutation()
  const [deleteVideo] = useDeleteVideoMutation()
  const [isDeleting, setIsDeleting] = useState(false)

  // Check if this video is currently playing
  const isCurrentlyPlaying = isOpen && currentVideo?.video_id === video.video_id

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  const handleVideoClick = async () => {
    dispatch(openPlayer(video))
    try {
      await updateVideoClick(video.video_id).unwrap()
    } catch (error) {
      console.error('Failed to update video click:', error)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await toggleVideoFavorite(video.video_id).unwrap()
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this video?')) {
      setIsDeleting(true)
      try {
        await deleteVideo(video.video_id).unwrap()
      } catch (error) {
        console.error('Failed to delete video:', error)
        setIsDeleting(false)
      }
    }
  }

  const isViewed = video.is_viewed || video.click_count > 0

  return (
    <div className={`
      group p-4 rounded-lg border transition-all duration-200 cursor-pointer
      bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
      ${isViewed ? 'opacity-70' : ''}
      ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div className="flex items-center space-x-4">
        {/* Playing Indicator */}
        <div className="flex-shrink-0 w-6 flex items-center justify-center">
          {isCurrentlyPlaying && (
            <div title="Currently playing">
              <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
            </div>
          )}
        </div>

        {/* Thumbnail */}
        <div 
          className="relative flex-shrink-0 cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className={`
            w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center
            transition-all duration-200 hover:opacity-80
            ${isViewed ? 'grayscale' : ''}
          `}>
            {video.channel_title ? (
              <div 
                className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                title={`${video.channel_title} channel`}
              >
                <span className="text-white font-bold text-sm">
                  {video.channel_title.charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <Play className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="h-4 w-4 text-white bg-black bg-opacity-60 rounded-full p-1" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleVideoClick}>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`
              font-medium truncate transition-colors flex items-center gap-2
              ${isViewed 
                ? 'text-gray-600 dark:text-gray-400' 
                : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
              }
            `}>
              {video.title}
              <Play className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity text-blue-500" />
            </h3>
            <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(video.discovered_at)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            Channel: {video.channel_title} • Published: {video.published_at ? formatDate(video.published_at) : 'Unknown'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* View Count */}
          <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {video.click_count}
            </span>
            <button
              onClick={handleToggleFavorite}
              className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Star className={`h-4 w-4 ${
                video.is_favorite 
                  ? 'text-yellow-500 fill-current' 
                  : 'text-gray-400 hover:text-yellow-500'
              }`} />
            </button>
          </div>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}