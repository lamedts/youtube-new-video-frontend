import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Video, VideoFilters, Pagination, VideosState, DateRange } from '@/types'

const initialState: VideosState = {
  items: [],
  loading: false,
  loadingMore: false,
  error: null,
  filters: {
    searchTerm: '',
    dateRange: { start: '', end: '' },
    showFavoritesOnly: false,
    showUnviewedOnly: false
  },
  pagination: { page: 1, limit: 20, total: 0 },
  hasMore: false,
  lastDocId: null,
  viewHistory: [],
  favorites: []
}

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.searchTerm = action.payload
      state.pagination.page = 1 // Reset to first page
      state.lastDocId = null // Reset pagination
      state.hasMore = false
      state.items = [] // Clear existing videos when filter changes
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.filters.dateRange = action.payload
      state.pagination.page = 1
      state.lastDocId = null
      state.hasMore = false
      state.items = []
    },
    toggleFavoritesFilter: (state) => {
      state.filters.showFavoritesOnly = !state.filters.showFavoritesOnly
      state.pagination.page = 1
      state.lastDocId = null
      state.hasMore = false
      state.items = []
    },
    toggleUnviewedFilter: (state) => {
      state.filters.showUnviewedOnly = !state.filters.showUnviewedOnly
      state.pagination.page = 1
      state.lastDocId = null
      state.hasMore = false
      state.items = []
    },
    addToViewHistory: (state, action: PayloadAction<string>) => {
      if (!state.viewHistory.includes(action.payload)) {
        state.viewHistory.push(action.payload)
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const videoId = action.payload
      if (state.favorites.includes(videoId)) {
        state.favorites = state.favorites.filter(id => id !== videoId)
      } else {
        state.favorites.push(videoId)
      }
    },
    clearFilters: (state) => {
      state.filters = initialState.filters
      state.pagination.page = 1
      state.lastDocId = null
      state.hasMore = false
      state.items = []
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.loadingMore = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setVideos: (state, action: PayloadAction<Video[]>) => {
      state.items = action.payload
    },
    appendVideos: (state, action: PayloadAction<Video[]>) => {
      // Append new videos avoiding duplicates
      const newVideos = action.payload.filter(
        newVideo => !state.items.some(existingVideo => existingVideo.video_id === newVideo.video_id)
      )
      state.items.push(...newVideos)
    },
    setPaginationState: (state, action: PayloadAction<{ hasMore: boolean, lastDocId: string | null }>) => {
      state.hasMore = action.payload.hasMore
      state.lastDocId = action.payload.lastDocId
    }
  }
})

export const {
  setSearchTerm,
  setDateRange,
  toggleFavoritesFilter,
  toggleUnviewedFilter,
  addToViewHistory,
  toggleFavorite,
  clearFilters,
  setLoading,
  setLoadingMore,
  setError,
  setVideos,
  appendVideos,
  setPaginationState
} = videosSlice.actions

export default videosSlice.reducer