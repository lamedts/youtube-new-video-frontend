import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Video, VideoFilters, Pagination, VideosState, DateRange } from '@/types'

const initialState: VideosState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    dateRange: { start: '', end: '' },
    showFavoritesOnly: false,
    showUnviewedOnly: false
  },
  pagination: { page: 1, limit: 20, total: 0 },
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
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.filters.dateRange = action.payload
      state.pagination.page = 1
    },
    toggleFavoritesFilter: (state) => {
      state.filters.showFavoritesOnly = !state.filters.showFavoritesOnly
      state.pagination.page = 1
    },
    toggleUnviewedFilter: (state) => {
      state.filters.showUnviewedOnly = !state.filters.showUnviewedOnly
      state.pagination.page = 1
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
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
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
  setError
} = videosSlice.actions

export default videosSlice.reducer