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

  const formatDate = (dateString: string) => {
    if (dateString === '-') {
      return '-'
    }
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return '-'
    }
  }

  if (isLoading) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YouTube Tool
              </h1>
            </div>
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

              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (error) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                YouTube Tool
              </h1>
            </div>
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

              <div className="text-sm text-red-500">Failed to load stats</div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left Section - Logo and Title */}
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              YouTube Tool
            </h1>
          </div>

          {/* Center Section - Stats Badges */}
          <div className="hidden md:flex items-center space-x-4">
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

          {/* Mobile Stats - Simplified */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
              <Users className="h-3 w-3 text-blue-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {stats?.stats.enabledChannels ?? '-'}/{stats?.stats.totalChannels ?? '-'}
              </span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
              <Video className="h-3 w-3 text-green-500" />
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {stats?.stats.videosThisWeek ?? '-'}
              </span>
            </div>
          </div>

          {/* Right Section - Autoplay, User & Last Sync */}
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

            {/* User Info & Logout */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
                    {user.email}
                  </span>
                </div>
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
              </div>
            )}

            {/* Last Sync */}
            <div className="hidden lg:block text-sm text-gray-500 dark:text-gray-400">
              Last sync: {stats?.lastSyncTime ? formatDate(stats.lastSyncTime) : '-'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
