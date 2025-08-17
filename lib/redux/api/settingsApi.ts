import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { BotSettings, HeaderData } from '@/types'

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      // Add auth headers if needed
      return headers
    }
  }),
  tagTypes: ['Settings', 'Stats', 'BotStatus'],
  endpoints: (builder) => ({
    getSettings: builder.query<BotSettings, void>({
      query: () => '/settings',
      providesTags: ['Settings']
    }),
    updateSettings: builder.mutation<BotSettings, Partial<BotSettings>>({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings
      }),
      invalidatesTags: ['Settings']
    }),
    getHeaderStats: builder.query<HeaderData, void>({
      query: () => '/stats/header',
      providesTags: ['Stats']
    }),
    testNotification: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/settings/test-notification',
        method: 'POST'
      })
    }),
    syncBot: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/bot/sync',
        method: 'POST'
      }),
      invalidatesTags: ['Stats', 'BotStatus']
    }),
    getBotStatus: builder.query<{
      isRunning: boolean
      lastSync: string
      uptime: number
    }, void>({
      query: () => '/bot/status',
      providesTags: ['BotStatus']
    }),
    startBot: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/bot/start',
        method: 'POST'
      }),
      invalidatesTags: ['BotStatus']
    }),
    stopBot: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/bot/stop',
        method: 'POST'
      }),
      invalidatesTags: ['BotStatus']
    }),
    getSystemLogs: builder.query<{ logs: string[]; timestamp: string }, { 
      limit?: number; 
      level?: 'info' | 'warn' | 'error' 
    }>({
      query: (params) => ({
        url: '/system/logs',
        params
      })
    }),
    exportConfig: builder.query<Blob, void>({
      query: () => ({
        url: '/settings/export',
        responseHandler: (response) => response.blob()
      })
    })
  })
})

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetHeaderStatsQuery,
  useTestNotificationMutation,
  useSyncBotMutation,
  useGetBotStatusQuery,
  useStartBotMutation,
  useStopBotMutation,
  useGetSystemLogsQuery,
  useLazyExportConfigQuery
} = settingsApi