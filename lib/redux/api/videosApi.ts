import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Video, VideoFilters } from '@/types'

export const videosApi = createApi({
  reducerPath: 'videosApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/videos',
    prepareHeaders: (headers, { getState }) => {
      // Add auth headers if needed
      return headers
    }
  }),
  tagTypes: ['Video', 'VideoStats'],
  endpoints: (builder) => ({
    getVideos: builder.query<Video[], VideoFilters>({
      query: (filters) => ({
        url: '',
        params: filters
      }),
      providesTags: ['Video']
    }),
    getVideoById: builder.query<Video, string>({
      query: (videoId) => `/${videoId}`,
      providesTags: ['Video']
    }),
    updateVideoClick: builder.mutation<Video, string>({
      query: (videoId) => ({
        url: `/${videoId}/click`,
        method: 'PUT'
      }),
      invalidatesTags: ['Video', 'VideoStats']
    }),
    toggleVideoFavorite: builder.mutation<Video, string>({
      query: (videoId) => ({
        url: `/${videoId}/favorite`,
        method: 'PUT'
      }),
      invalidatesTags: ['Video']
    }),
    markVideoViewed: builder.mutation<Video, string>({
      query: (videoId) => ({
        url: `/${videoId}/viewed`,
        method: 'PUT'
      }),
      invalidatesTags: ['Video']
    }),
    deleteVideo: builder.mutation<void, string>({
      query: (videoId) => ({
        url: `/${videoId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Video', 'VideoStats']
    }),
    searchVideos: builder.query<Video[], { query: string; limit?: number }>({
      query: ({ query, limit = 20 }) => ({
        url: '/search',
        params: { q: query, limit }
      }),
      providesTags: ['Video']
    }),
    getVideosByChannel: builder.query<Video[], string>({
      query: (channelId) => `/by-channel/${channelId}`,
      providesTags: ['Video']
    })
  })
})

export const {
  useGetVideosQuery,
  useGetVideoByIdQuery,
  useUpdateVideoClickMutation,
  useToggleVideoFavoriteMutation,
  useMarkVideoViewedMutation,
  useDeleteVideoMutation,
  useSearchVideosQuery,
  useGetVideosByChannelQuery
} = videosApi