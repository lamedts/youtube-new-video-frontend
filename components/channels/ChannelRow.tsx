'use client'

import { useState } from 'react'
import { Bell, BellOff, Users, Calendar, ExternalLink } from 'lucide-react'
import { Channel } from '@/types'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { toggleChannelSelection } from '@/lib/redux/slices/channelsSlice'
import { useToggleChannelNotificationMutation } from '@/lib/redux/api/channelsApi'

interface ChannelRowProps {
  channel: Channel
}

// Color palette for channel avatars
const avatarColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500'
]

export default function ChannelRow({ channel }: ChannelRowProps) {
  const dispatch = useAppDispatch()
  const { selectedChannels } = useAppSelector(state => state.channels)
  const [toggleChannelNotification] = useToggleChannelNotificationMutation()
  const [isToggling, setIsToggling] = useState(false)

  const isSelected = selectedChannels.includes(channel.channel_id)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return ''
    }
  }

  const formatSubscriberCount = (count: string) => {
    if (!count) return '-'
    const num = parseInt(count.replace(/[^\d]/g, ''))
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M subscribers`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K subscribers`
    }
    return `${num} subscribers`
  }

  const getAvatarColor = (channelTitle: string) => {
    const hash = channelTitle.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    return avatarColors[Math.abs(hash) % avatarColors.length]
  }

  const getChannelInitial = (channelTitle: string) => {
    return channelTitle.charAt(0).toUpperCase()
  }

  const handleCheckboxChange = () => {
    dispatch(toggleChannelSelection(channel.channel_id))
  }

  const handleNotificationToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsToggling(true)
    try {
      await toggleChannelNotification(channel.channel_id).unwrap()
    } catch (error) {
      console.error('Failed to toggle notification:', error)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className={`
      group p-4 rounded-lg border transition-all duration-200
      bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700
      hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
      ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
      ${isToggling ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div className="flex items-center space-x-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheckboxChange}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
        />

        {/* Channel Thumbnail/Avatar */}
        <div className="flex-shrink-0">
          {channel.thumbnail ? (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className={`
              w-24 h-24 rounded-full flex items-center justify-center text-white font-bold
              ${getAvatarColor(channel.title)}
            `}>
              {getChannelInitial(channel.title)}
            </div>
          )}
        </div>

        {/* Channel Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white truncate">
              {channel.title}
            </h3>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              {formatSubscriberCount(channel.subscriber_count || '')}
            </p>
            {channel.last_upload_at && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                <span className="inline-flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last upload at: {formatDate(channel.last_upload_at)}
                </span>
              </p>
            )}
            {channel.link && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                <a 
                  href={channel.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View channel
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Notification Toggle */}
        <button
          onClick={handleNotificationToggle}
          disabled={isToggling}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${channel.notify
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              : 'text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={channel.notify ? 'Disable notifications' : 'Enable notifications'}
        >
          {channel.notify ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}
