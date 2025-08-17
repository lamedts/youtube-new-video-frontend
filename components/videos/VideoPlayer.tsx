'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Minimize2, Maximize2, X, Eye, ExternalLink, Move } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { closePlayer, toggleMinimize } from '@/lib/redux/slices/playerSlice'

export default function VideoPlayer() {
  const dispatch = useAppDispatch()
  const { isOpen, isMinimized, currentVideo, settings } = useAppSelector(state => state.player)

  // Safety check for settings
  const autoplayEnabled = settings?.autoplay || false
  const [showPlayer, setShowPlayer] = useState(false)
  const [playerSize, setPlayerSize] = useState({ width: 576, height: 396 }) // 1.5x larger (384*1.5=576, 264*1.5=396)
  const [isResizing, setIsResizing] = useState(false)
  const playerRef = useRef<HTMLDivElement>(null)

  // Reset player state when video changes and handle autoplay
  useEffect(() => {
    if (currentVideo?.video_id) {
      if (autoplayEnabled) {
        setShowPlayer(true) // Auto-start if autoplay is enabled
      } else {
        setShowPlayer(false) // Show thumbnail if autoplay is disabled
      }
    }
  }, [currentVideo?.video_id, autoplayEnabled])

  if (!isOpen || !currentVideo) return null

  const handleClose = () => {
    dispatch(closePlayer())
    setShowPlayer(false)
  }

  const handleToggleMinimize = () => {
    dispatch(toggleMinimize())
  }

  const handlePlayClick = () => {
    setShowPlayer(true)
  }

  const handleOpenYouTube = () => {
    const url = currentVideo?.youtube_url || currentVideo?.link
    if (url) {
      window.open(url, '_blank')
    }
  }

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | undefined) => {
    if (!url || typeof url !== 'string') return null
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const videoUrl = currentVideo?.youtube_url || currentVideo?.link
  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = playerSize.width
    const startHeight = playerSize.height

    const handleMouseMove = (e: MouseEvent) => {
      // For top-left resize, we subtract the delta to make it grow in opposite direction
      const deltaX = startX - e.clientX
      const deltaY = startY - e.clientY

      // Maintain aspect ratio (16:9)
      const newWidth = Math.max(320, startWidth + deltaX)
      const newHeight = Math.max(240, startHeight + deltaY)

      // Use the smaller dimension to maintain aspect ratio
      const aspectRatio = 16 / 9
      const widthBasedHeight = newWidth / aspectRatio
      const heightBasedWidth = newHeight * aspectRatio

      if (widthBasedHeight <= newHeight) {
        setPlayerSize({ width: newWidth, height: widthBasedHeight })
      } else {
        setPlayerSize({ width: heightBasedWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div
      ref={playerRef}
      className={`
        fixed bottom-4 right-4 z-50
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-2xl
        transition-all duration-300 ease-in-out
        ${isResizing ? 'select-none' : ''}
        ${isMinimized ? 'w-80 h-16' : ''}
      `}
      style={isMinimized ? {} : {
        width: `${playerSize.width}px`,
        height: `${playerSize.height + 120}px` // +120 for header and expanded info sections
      }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg relative">
        {/* Resize Handle - Top Left */}
        {!isMinimized && (
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100 transition-opacity z-10"
            onMouseDown={handleResizeStart}
            title="Drag to resize"
          >
            <Move className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}

        <div className="flex items-center space-x-2 flex-1 min-w-0 ml-4">
          <Play className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentVideo?.title || 'Video'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {showPlayer && !isMinimized && (
            <button
              onClick={handleOpenYouTube}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Open in YouTube"
            >
              <ExternalLink className="h-4 w-4 text-red-500" />
            </button>
          )}
          <button
            onClick={handleToggleMinimize}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Close"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content - Only show when expanded */}
      {!isMinimized && (
        <>
          {/* Video Player Area */}
          <div
            className="relative bg-black"
            style={{
              width: `${playerSize.width}px`,
              height: `${playerSize.height}px`
            }}
          >
            {showPlayer && videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title={currentVideo?.title || 'YouTube video'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              // Thumbnail preview with play button
              <>
                {currentVideo?.thumbnail ? (
                  <img
                    src={currentVideo.thumbnail}
                    alt={currentVideo?.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Play className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                {/* Overlay with play button */}
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center group">
                  <button
                    onClick={handlePlayClick}
                    className="bg-red-600 hover:bg-red-700 rounded-full p-4 transition-all duration-200
                             hover:scale-110 group-hover:scale-105 shadow-lg"
                    title="Play video"
                  >
                    <Play className="h-8 w-8 text-white ml-1" />
                  </button>
                  <span className="text-white text-sm mt-2 opacity-90 font-medium">
                    Click to play video
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Info Section */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-b-lg flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {currentVideo?.title || 'Unknown Title'}
                </p>
                <div className="grid grid-cols-1 gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <p className="truncate">ID: {currentVideo?.video_id || 'Unknown'}</p>
                  <p className="truncate">Channel: {currentVideo?.channel_title || 'Unknown'}</p>
                  <p>Published: {currentVideo?.published_at ? formatDate(currentVideo.published_at) : 'Unknown'}</p>
                </div>
              </div>

              {/* View Count Badge */}
              <div className="flex-shrink-0 flex items-center space-x-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 self-start">
                <Eye className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-medium text-gray-900 dark:text-white">
                  {currentVideo?.click_count || 0}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
