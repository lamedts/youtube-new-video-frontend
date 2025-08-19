import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Video, PlayerState, PlayerSettings } from '@/types'

const initialState: PlayerState = {
  isOpen: false,
  isMinimized: false,
  currentVideo: null,
  playHistory: [],
  settings: {
    autoplay: true,
    volume: 0.8,
    rememberPosition: true
  }
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    openPlayer: (state, action: PayloadAction<Video>) => {
      state.isOpen = true
      state.isMinimized = false
      state.currentVideo = action.payload
      // Add to play history (max 10 items)
      state.playHistory = [
        action.payload,
        ...state.playHistory.filter(v => v.video_id !== action.payload.video_id)
      ].slice(0, 10)
    },
    closePlayer: (state) => {
      state.isOpen = false
      state.currentVideo = null
    },
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized
    },
    updatePlayerSettings: (state, action: PayloadAction<Partial<PlayerSettings>>) => {
      state.settings = { ...state.settings, ...action.payload }
    },
    clearPlayHistory: (state) => {
      state.playHistory = []
    }
  }
})

export const {
  openPlayer,
  closePlayer,
  toggleMinimize,
  updatePlayerSettings,
  clearPlayHistory
} = playerSlice.actions

export default playerSlice.reducer