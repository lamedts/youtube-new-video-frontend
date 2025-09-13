'use client'

import { useState } from 'react'
import { Search, Calendar } from 'lucide-react'
import VideoList from './VideoList'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setSearchTerm, setDateRange, toggleFavoritesFilter, toggleUnviewedFilter } from '@/lib/redux/slices/videosSlice'

export default function VideosTab() {
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector(state => state.videos)
  const [startDate, setStartDate] = useState(filters.dateRange.start)
  const [endDate, setEndDate] = useState(filters.dateRange.end)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value))
  }

  const handleDateRangeChange = () => {
    dispatch(setDateRange({ start: startDate, end: endDate }))
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value
    setStartDate(newStartDate)
    dispatch(setDateRange({ start: newStartDate, end: endDate }))
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value
    setEndDate(newEndDate)
    dispatch(setDateRange({ start: startDate, end: newEndDate }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Bar - Fixed */}
      <div className="flex-shrink-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 mt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={filters.searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-red-500 focus:border-transparent
                       placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Date Range */}
          <div className="flex gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => dispatch(toggleFavoritesFilter())}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filters.showFavoritesOnly
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            ⭐ Favorites Only
          </button>
          <button
            onClick={() => dispatch(toggleUnviewedFilter())}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filters.showUnviewedOnly
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            👁️ Unviewed Only
          </button>
        </div>
        </div>
      </div>

      {/* Video List - Scrollable */}
      <div className="flex-1 overflow-y-scroll">
        <VideoList />
      </div>
    </div>
  )
}