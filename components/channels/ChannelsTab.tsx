'use client'

import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import ChannelList from './ChannelList'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { 
  setChannelSearchTerm, 
  setNotificationFilter, 
  setSortBy, 
  toggleSortOrder,
  clearChannelSelection,
  selectAllChannels
} from '@/lib/redux/slices/channelsSlice'
import { useBulkUpdateNotificationsMutation } from '@/lib/redux/api/channelsApi'

export default function ChannelsTab() {
  const dispatch = useAppDispatch()
  const { filters, selectedChannels, bulkOperations } = useAppSelector(state => state.channels)
  const [bulkUpdateNotifications] = useBulkUpdateNotificationsMutation()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setChannelSearchTerm(e.target.value))
  }

  const handleNotificationFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setNotificationFilter(e.target.value as 'all' | 'notify-on' | 'notify-off'))
  }

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setSortBy(e.target.value as 'name' | 'subscribers' | 'last_video' | 'last_upload'))
  }

  const handleBulkEnable = async () => {
    if (selectedChannels.length > 0) {
      try {
        await bulkUpdateNotifications({ channelIds: selectedChannels, notify: true }).unwrap()
        dispatch(clearChannelSelection())
      } catch (error) {
        console.error('Failed to enable notifications:', error)
      }
    }
  }

  const handleBulkDisable = async () => {
    if (selectedChannels.length > 0) {
      try {
        await bulkUpdateNotifications({ channelIds: selectedChannels, notify: false }).unwrap()
        dispatch(clearChannelSelection())
      } catch (error) {
        console.error('Failed to disable notifications:', error)
      }
    }
  }

  const handleSelectAll = () => {
    dispatch(selectAllChannels())
  }

  const handleClearSelection = () => {
    dispatch(clearChannelSelection())
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-red-500 focus:border-transparent
                       placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filters.notificationFilter}
            onChange={handleNotificationFilterChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">All Channels</option>
            <option value="notify-on">Notifications On</option>
            <option value="notify-off">Notifications Off</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={filters.sortBy}
            onChange={handleSortByChange}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="name">Sort by Name</option>
            <option value="subscribers">Sort by Subscribers</option>
            <option value="last_video">Sort by Last Video</option>
            <option value="last_upload">Sort by Last Upload</option>
          </select>

          {/* Sort Order Button */}
          <button
            onClick={() => dispatch(toggleSortOrder())}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {filters.sortOrder === 'asc' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedChannels.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                {selectedChannels.length} channel{selectedChannels.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkEnable}
                  disabled={bulkOperations.loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Enable Notifications
                </button>
                <button
                  onClick={handleBulkDisable}
                  disabled={bulkOperations.loading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Disable Notifications
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selection Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            Select All
          </button>
          {selectedChannels.length > 0 && (
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>

      {/* Channel List */}
      <ChannelList />
    </div>
  )
}