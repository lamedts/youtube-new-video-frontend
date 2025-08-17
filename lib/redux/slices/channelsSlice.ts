import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Channel, ChannelFilters, ChannelsState, NotificationFilter, ChannelSortBy } from '@/types'

const initialState: ChannelsState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    notificationFilter: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  selectedChannels: [],
  bulkOperations: {
    loading: false,
    error: null
  }
}

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannelSearchTerm: (state, action: PayloadAction<string>) => {
      state.filters.searchTerm = action.payload
    },
    setNotificationFilter: (state, action: PayloadAction<NotificationFilter>) => {
      state.filters.notificationFilter = action.payload
    },
    setSortBy: (state, action: PayloadAction<ChannelSortBy>) => {
      state.filters.sortBy = action.payload
    },
    toggleSortOrder: (state) => {
      state.filters.sortOrder = state.filters.sortOrder === 'asc' ? 'desc' : 'asc'
    },
    toggleChannelSelection: (state, action: PayloadAction<string>) => {
      const channelId = action.payload
      if (state.selectedChannels.includes(channelId)) {
        state.selectedChannels = state.selectedChannels.filter(id => id !== channelId)
      } else {
        state.selectedChannels.push(channelId)
      }
    },
    selectAllChannels: (state) => {
      state.selectedChannels = state.items.map(channel => channel.channel_id)
    },
    clearChannelSelection: (state) => {
      state.selectedChannels = []
    },
    setBulkOperationLoading: (state, action: PayloadAction<boolean>) => {
      state.bulkOperations.loading = action.payload
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
  setChannelSearchTerm,
  setNotificationFilter,
  setSortBy,
  toggleSortOrder,
  toggleChannelSelection,
  selectAllChannels,
  clearChannelSelection,
  setBulkOperationLoading,
  setLoading,
  setError
} = channelsSlice.actions

export default channelsSlice.reducer