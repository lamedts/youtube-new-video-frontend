import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UIState, AppNotification } from '@/types'

const initialState: UIState = {
  darkMode: false,
  activeTab: 'videos',
  notifications: [],
  sidebar: {
    isOpen: false,
    width: 280
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    },
    setActiveTab: (state, action: PayloadAction<'videos' | 'channels'>) => {
      state.activeTab = action.payload
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearAllNotifications: (state) => {
      state.notifications = []
    },
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebar.width = action.payload
    }
  }
})

export const {
  toggleDarkMode,
  setActiveTab,
  addNotification,
  removeNotification,
  clearAllNotifications,
  toggleSidebar,
  setSidebarWidth
} = uiSlice.actions

export default uiSlice.reducer