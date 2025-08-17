'use client'

import { Video, Users, Bell, PlayCircle, PauseCircle, LogOut, User } from 'lucide-react'
import { useGetHeaderStatsQuery } from '@/lib/redux/api/settingsApi'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { updatePlayerSettings } from '@/lib/redux/slices/playerSlice'
import { useAuth } from '@/lib/firebase/auth'

export default function Header() {
  const { data: stats, isLoading, error } = useGetHeaderStatsQuery()
  const dispatch = useAppDispatch()
  const { settings } = useAppSelector(state => state.player)
  const { user, logout } = useAuth()

  const handleToggleAutoplay = () => {
    dispatch(updatePlayerSettings({ autoplay: !settings.autoplay }))
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const formatDate = (dateValue: any) => {
    if (dateValue === '-' || !dateValue) {
      return '-'
    }
    try {
      // Handle Firestore Timestamp objects (check for seconds and nanoseconds properties)
      if (dateValue && typeof dateValue === 'object' && 
          typeof dateValue.seconds === 'number' && 
          typeof dateValue.nanoseconds === 'number') {
        // Convert Firestore Timestamp to JavaScript Date
        const jsDate = new Date(dateValue.seconds * 1000 + dateValue.nanoseconds / 1000000)
        console.log('Converted Firestore Timestamp to JS Date:', jsDate)
        return jsDate.toLocaleString()
      }
      // Handle Firestore Timestamp objects with toDate method (older format)
      if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        const jsDate = dateValue.toDate()
        console.log('Converted Firestore Timestamp to JS Date (toDate):', jsDate)
        return jsDate.toLocaleString()
      }
      // Handle regular date strings
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) {
          return '-'
        }
        return date.toLocaleString()
      }
      // Handle Date objects
      if (dateValue instanceof Date) {
        return dateValue.toLocaleString()
      }
      console.log('Unhandled date value:', dateValue, 'Type:', typeof dateValue)
      return '-'
    } catch (error) {
      console.error('Date formatting error:', error)
      return '-'
    }
  }

  if (isLoading) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YouTube Tool
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Sign Out
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleAutoplay}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  settings.autoplay ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
                }`}
                title={`Video Autoplay: ${settings.autoplay ? 'ON' : 'OFF'}`}
              >
                {settings.autoplay ? (
                  <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <PauseCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Autoplay {settings.autoplay ? 'ON' : 'OFF'}
                </span>
              </button>
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-24 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (error) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YouTube Tool
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Sign Out
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="text-sm text-red-500">Failed to load stats</div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleToggleAutoplay}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                  settings.autoplay ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
                }`}
                title={`Video Autoplay: ${settings.autoplay ? 'ON' : 'OFF'}`}
              >
                {settings.autoplay ? (
                  <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <PauseCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Autoplay {settings.autoplay ? 'ON' : 'OFF'}
                </span>
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">Last sync: -</div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* First Line - Logo and Logout */}
        <div className="flex items-center justify-between h-16">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              YouTube Tool
            </h1>
          </div>

          {/* Right Section - Logout Only */}
          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  Sign Out
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Second Line - Stats */}
        <div className="flex items-center justify-between pb-3 border-t border-gray-100 dark:border-gray-700 pt-3">
          {/* Stats Section */}
          <div className="flex items-center space-x-4">
            {/* Channel Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats?.stats.enabledChannels ?? '-'}/{stats?.stats.totalChannels ?? '-'} Channels
              </span>
            </div>

            {/* Weekly Videos Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Video className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats?.stats.videosThisWeek ?? '-'} Videos This Week
              </span>
            </div>

            {/* Total Videos Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
              <Video className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {stats?.stats.totalVideos ?? '-'} Total Videos
              </span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center space-x-4">
            {/* Autoplay Toggle */}
            <button
              onClick={handleToggleAutoplay}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                settings.autoplay ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
              }`}
              title={`Video Autoplay: ${settings.autoplay ? 'ON' : 'OFF'}`}
            >
              {settings.autoplay ? (
                <PlayCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <PauseCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Autoplay {settings.autoplay ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Last Sync */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last sync: {stats?.lastSyncTime ? formatDate(stats.lastSyncTime) : '-'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
