import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Channel, ChannelFilters, BulkNotificationUpdate } from '@/types'

export const channelsApi = createApi({
  reducerPath: 'channelsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/channels',
    prepareHeaders: (headers, { getState }) => {
      // Add auth headers if needed
      return headers
    }
  }),
  tagTypes: ['Channel', 'ChannelStats'],
  endpoints: (builder) => ({
    getChannels: builder.query<Channel[], ChannelFilters>({
      query: (filters) => ({ 
        url: '', 
        params: filters 
      }),
      providesTags: ['Channel']
    }),
    getChannelById: builder.query<Channel, string>({
      query: (channelId) => `/${channelId}`,
      providesTags: ['Channel']
    }),
    toggleChannelNotification: builder.mutation<Channel, string>({
      query: (channelId) => ({
        url: `/${channelId}/notify`,
        method: 'PUT'
      }),
      invalidatesTags: ['Channel', 'ChannelStats']
    }),
    bulkUpdateNotifications: builder.mutation<void, BulkNotificationUpdate>({
      query: (data) => ({
        url: '/bulk-notify',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Channel', 'ChannelStats']
    }),
    addChannel: builder.mutation<Channel, { rssUrl: string }>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['Channel', 'ChannelStats']
    }),
    deleteChannel: builder.mutation<void, string>({
      query: (channelId) => ({
        url: `/${channelId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Channel', 'ChannelStats']
    }),
    syncChannels: builder.mutation<void, void>({
      query: () => ({
        url: '/sync',
        method: 'POST'
      }),
      invalidatesTags: ['Channel', 'ChannelStats']
    })
  })
})

export const {
  useGetChannelsQuery,
  useGetChannelByIdQuery,
  useToggleChannelNotificationMutation,
  useBulkUpdateNotificationsMutation,
  useAddChannelMutation,
  useDeleteChannelMutation,
  useSyncChannelsMutation
} = channelsApi