import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import videosReducer from './slices/videosSlice'
import channelsReducer from './slices/channelsSlice'
import playerReducer from './slices/playerSlice'
import settingsReducer from './slices/settingsSlice'
import uiReducer from './slices/uiSlice'
import { videosApi } from './api/videosApi'
import { channelsApi } from './api/channelsApi'
import { settingsApi } from './api/settingsApi'

export const store = configureStore({
  reducer: {
    videos: videosReducer,
    channels: channelsReducer,
    player: playerReducer,
    settings: settingsReducer,
    ui: uiReducer,
    // RTK Query APIs
    [videosApi.reducerPath]: videosApi.reducer,
    [channelsApi.reducerPath]: channelsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
    .concat(videosApi.middleware)
    .concat(channelsApi.middleware)
    .concat(settingsApi.middleware),
  devTools: process.env.NODE_ENV !== 'production'
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch