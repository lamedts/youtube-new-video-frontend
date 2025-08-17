import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BotSettings, SettingsState } from '@/types'

const initialState: SettingsState = {
  botConfig: {
    telegram: {
      botToken: '',
      chatId: ''
    },
    youtube: {
      clientSecretFile: '',
      tokenFile: ''
    },
    firebase: {
      credentialsFile: '',
      projectId: ''
    },
    polling: {
      videoCheckIntervalSeconds: 300,
      subscriptionSyncIntervalMinutes: 60
    },
    notifications: {
      initMode: false,
      globalNotificationsEnabled: true
    }
  },
  modalOpen: false,
  loading: false,
  error: null,
  connectionStatus: {
    firebase: 'checking',
    youtube: 'checking',
    telegram: 'checking'
  }
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    openSettingsModal: (state) => {
      state.modalOpen = true
    },
    closeSettingsModal: (state) => {
      state.modalOpen = false
    },
    updateBotConfig: (state, action: PayloadAction<Partial<BotSettings>>) => {
      state.botConfig = { ...state.botConfig, ...action.payload }
    },
    setConnectionStatus: (state, action: PayloadAction<{ 
      service: 'firebase' | 'youtube' | 'telegram'; 
      status: 'connected' | 'disconnected' | 'checking' 
    }>) => {
      state.connectionStatus[action.payload.service] = action.payload.status
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
  openSettingsModal,
  closeSettingsModal,
  updateBotConfig,
  setConnectionStatus,
  setLoading,
  setError
} = settingsSlice.actions

export default settingsSlice.reducer