'use client'

import { useState } from 'react'
import { Eye, Star, Trash2, Play, Volume2, BellOff } from 'lucide-react'
import { Video, VideoWithChannel, Channel } from '@/types'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { openPlayer, refreshPlayer } from '@/lib/redux/slices/playerSlice'
import { useUpdateVideoClickMutation, useToggleVideoFavoriteMutation, useDeleteVideoMutation } from '@/lib/redux/api/videosApi'
import { useGetChannelsQuery, useToggleChannelNotificationMutation } from '@/lib/redux/api/channelsApi'
import { settingsApi } from '@/lib/redux/api/settingsApi'
import { useChannelCache } from '@/lib/hooks/useVideoChannelCache'

interface VideoRowProps {
  video: Video | VideoWithChannel
  // Optional: provide channel data directly to avoid lookup
  channelData?: Channel
}

export default function VideoRow({ video, channelData }: VideoRowProps) {
  const dispatch = useAppDispatch()
  const { currentVideo, isOpen } = useAppSelector(state => state.player)
  const [updateVideoClick] = useUpdateVideoClickMutation()
  const [toggleVideoFavorite] = useToggleVideoFavoriteMutation()
  const [deleteVideo] = useDeleteVideoMutation()
  const [toggleChannelNotification] = useToggleChannelNotificationMutation()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingNotification, setIsTogglingNotification] = useState(false)

  // Check if this video is currently playing
  const isCurrentlyPlaying = isOpen && currentVideo?.video_id === video.video_id

  // Get channel data with multiple fallback strategies
  // Strategy 1: Check if we have populated channel data
  const hasPopulatedChannel = 'channel' in video && video.channel && typeof video.channel === 'object' && 'channel_id' in video.channel
  const populatedChannel = hasPopulatedChannel ? (video as VideoWithChannel).channel : null

  // Strategy 2: Try cache for individual channel lookup (always call hook)
  // Extract channel ID from DocumentReference - check multiple possible field names
  const documentRef = (video as any).channel || (video as any).channel_ref

  // Extract channel ID from different DocumentReference formats
  let channelId: string | undefined
  if (documentRef?.referencePath) {
    // Format: "subscriptions/UCCj956IF62FDNT7Gouszaj9w" -> extract "UCCj956IF62FDNT7Gouszaj9w"
    channelId = documentRef.referencePath.split('/').pop()
  } else if (documentRef?.id) {
    channelId = documentRef.id
  } else if (documentRef?._path?.segments?.length > 0) {
    channelId = documentRef._path.segments.slice(-1)[0] // Last segment
  } else {
    channelId = video.channel_id // Legacy fallback
  }
  const { channel: cachedChannel } = useChannelCache(channelId || '')

  // Strategy 3: Fallback to legacy channel query (for backward compatibility)
  const hasChannelData = channelData || populatedChannel || cachedChannel
  const { data: channelsData } = useGetChannelsQuery({
    searchTerm: '',
    notificationFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: '1000' // IMMEDIATE FIX: Fetch more channels to avoid pagination limits
  }, {
    skip: !!hasChannelData // Skip this query if we already have channel data
  })

  // Determine final channel data to use
  let channel: Channel | null = null
  if (channelData) {
    channel = channelData // Strategy 1: Use provided channelData prop
  } else if (populatedChannel) {
    channel = populatedChannel // Strategy 2: Use populated channel from VideoWithChannel
  } else if (cachedChannel) {
    channel = cachedChannel // Strategy 3: Use cached channel data
  } else if (channelsData?.channels && channelId) {
    // Strategy 4: Search in channels query result
    channel = channelsData.channels.find(ch => ch.channel_id === channelId) || null
  }

  // Debug logging to understand what's happening
  if (process.env.NODE_ENV === 'development') {
    console.log(`[VideoRow Debug] ${video.channel_title || 'Unknown Channel'}:`, {
      // Video data inspection
      videoId: video.video_id,
      videoTitle: video.title,
      legacyChannelId: video.channel_id, // Legacy field (should be undefined after migration)
      legacyChannelTitle: video.channel_title, // Legacy field (should be undefined after migration)
      documentRefChannelId: channelId, // Extracted from DocumentReference
      hasDocumentRef: !!documentRef,
      documentRefPath: documentRef?._path?.segments?.join('/'),
      documentRefId: documentRef?.id,
      documentRefSegments: documentRef?._path?.segments,
      // Detailed DocumentReference inspection
      documentRefType: typeof documentRef,
      documentRefKeys: documentRef ? Object.keys(documentRef) : null,
      documentRefConstructor: documentRef?.constructor?.name,
      // Check different possible structures
      channelRefField: (video as any).channel_ref,
      channelRefType: typeof (video as any).channel_ref,
      channelRefKeys: (video as any).channel_ref ? Object.keys((video as any).channel_ref) : null,
      videoKeys: Object.keys(video),

      // Channel lookup results
      hasChannelData: !!channelData,
      hasPopulatedChannel: !!populatedChannel,
      hasCachedChannel: !!cachedChannel,
      hasChannelsQuery: !!channelsData?.channels?.length,
      channelsQueryTotal: channelsData?.channels?.length || 0,

      // Final results
      finalChannelFound: !!channel,
      finalChannelThumbnail: channel?.thumbnail,
      finalChannelTitle: channel?.title || video.channel_title
    })
  }

  const formatDateTime = (dateString: string) => {
    try {
      // Automatically converts UTC/ISO datetime to user's browser/system timezone without displaying timezone name
      // This respects the user's local timezone settings for display while keeping the original UTC data intact
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Unknown'
    }
  }

  const handleVideoClick = async () => {
    // Check if this video is already the currently playing video
    if (isCurrentlyPlaying) {
      // Second click on same video - refresh the player
      dispatch(refreshPlayer())
    } else {
      // First click or different video - open normally
      dispatch(openPlayer(video))
    }
    
    try {
      await updateVideoClick(video.video_id).unwrap()
      // Manually invalidate header stats to refresh new videos count
      dispatch(settingsApi.util.invalidateTags(['Stats']))
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
        // Manually invalidate header stats to refresh total videos count
        dispatch(settingsApi.util.invalidateTags(['Stats']))
      } catch (error) {
        console.error('Failed to delete video:', error)
        setIsDeleting(false)
      }
    }
  }

  const handleDisableChannelNotification = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to disable notifications for ${video.channel_title}?`)) {
      setIsTogglingNotification(true)
      try {
        // Only disable if channel is currently enabled
        const channel = channelsData?.channels?.find(ch => ch.channel_id === video.channel_id)
        if (channel?.notify) {
          await toggleChannelNotification(video.channel_id).unwrap()
          // Manually invalidate header stats to refresh notifications count
          dispatch(settingsApi.util.invalidateTags(['Stats']))
        }
        setIsTogglingNotification(false)
      } catch (error) {
        console.error('Failed to disable channel notification:', error)
        setIsTogglingNotification(false)
      }
    }
  }

  const isViewed = video.is_viewed || video.click_count > 0

  return (
    <div className={`
      w-full group p-4 rounded-lg border transition-all duration-200 cursor-pointer
      bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
      ${isViewed ? 'opacity-70' : ''}
      ${isDeleting || isTogglingNotification ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div className="flex items-center space-x-4 w-full">
        {/* Playing Indicator / New Video Dot */}
        <div className="flex-shrink-0 w-6 flex items-center justify-center">
          {isCurrentlyPlaying ? (
            <div title="Currently playing">
              <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
            </div>
          ) : (video.click_count === 0 || video.click_count === null || video.click_count === undefined) ? (
            <div 
              className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
              title="New video"
            />
          ) : null}
        </div>

        {/* Channel Thumbnail */}
        <div
          className="relative flex-shrink-0 cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className={`
            w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center
            transition-all duration-200 hover:opacity-80
            ${isViewed ? 'grayscale' : ''}
          `}>
            {channel?.thumbnail && channelId ? (
              <img
                src={`/api/thumbnails/${channelId}?fallback=${encodeURIComponent(channel.thumbnail)}`}
                alt={channel.title || 'Channel'}
                className="w-full h-full rounded-lg object-cover"
                loading="lazy"
                onError={(e) => {
                  // Hide image on 429 or other errors and show fallback
                  console.warn(`Thumbnail failed to load for ${channel.title}:`, e);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : channel?.title ? (
              <div
                className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                title={`${channel.title} channel`}
              >
                <span className="text-white font-bold text-sm">
                  {channel.title.charAt(0).toUpperCase()}
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
        <div className="flex-1 min-w-0 cursor-pointer overflow-hidden" onClick={handleVideoClick}>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`
              font-medium truncate transition-colors flex items-center gap-2 flex-1 min-w-0
              ${isViewed
                ? 'text-gray-600 dark:text-gray-400'
                : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
              }
            `}>
              <span className="truncate flex-1 min-w-0">{video.title}</span>
              <Play className="h-3 w-3 opacity-0 group-hover:opacity-70 transition-opacity text-blue-500 flex-shrink-0" />
            </h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-1 w-full">
            Channel: {video.channel_title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-full">
            Published: {video.published_at ? formatDateTime(video.published_at) : 'Unknown'}
          </p>
          <div className="flex items-center space-x-2 mt-2">
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Disable Channel Notification Button */}
          <button
            onClick={handleDisableChannelNotification}
            disabled={isTogglingNotification}
            className="p-2 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
            title="Disable notifications for this channel"
          >
            <BellOff className="h-4 w-4" />
          </button>

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
