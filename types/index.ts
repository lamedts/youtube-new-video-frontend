// Core data models
export interface Video {
  video_id: string
  title: string
  channel_id: string
  channel_title: string
  channel_thumbnail?: string
  link: string
  youtube_url: string
  thumbnail?: string
  discovered_at: string
  published_at?: string
  description?: string
  click_count: number
  is_viewed: boolean
  is_favorite: boolean
}

export interface Channel {
  channel_id: string
  title: string
  thumbnail?: string
  subscriber_count?: string
  last_video_id: string
  last_video_title?: string
  last_upload_at?: string
  notify: boolean
  subscribed_at: string
  last_updated: string
  rss_url: string
  link?: string
}

// State interfaces
export interface HeaderData {
  stats: {
    enabledChannels: number
    totalChannels: number
    newVideos: number
    totalVideos: number
  }
  lastSyncTime: string
}

export interface VideoFilters {
  searchTerm: string
  dateRange: { start: string; end: string }
  showFavoritesOnly: boolean
  showUnviewedOnly: boolean
}

export interface ChannelFilters {
  searchTerm: string
  notificationFilter: 'all' | 'notify-on' | 'notify-off'
  sortBy: 'name' | 'subscribers' | 'last_video' | 'last_upload'
  sortOrder: 'asc' | 'desc'
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export interface PlayerSettings {
  autoplay: boolean
  volume: number
  rememberPosition: boolean
}

export interface BotSettings {
  telegram: {
    botToken: string
    chatId: string
  }
  youtube: {
    clientSecretFile: string
    tokenFile: string
  }
  firebase: {
    credentialsFile: string
    projectId: string
  }
  polling: {
    videoCheckIntervalSeconds: number
    subscriptionSyncIntervalMinutes: number
  }
  notifications: {
    initMode: boolean
    globalNotificationsEnabled: boolean
  }
}

// Redux state interfaces
export interface VideosState {
  items: Video[]
  loading: boolean
  error: string | null
  filters: VideoFilters
  pagination: Pagination
  viewHistory: string[]
  favorites: string[]
}

export interface ChannelsState {
  items: Channel[]
  loading: boolean
  error: string | null
  filters: ChannelFilters
  selectedChannels: string[]
  bulkOperations: {
    loading: boolean
    error: string | null
  }
}

export interface PlayerState {
  isOpen: boolean
  isMinimized: boolean
  currentVideo: Video | null
  playHistory: Video[]
  settings: PlayerSettings
}

export interface SettingsState {
  botConfig: BotSettings
  modalOpen: boolean
  loading: boolean
  error: string | null
  connectionStatus: {
    firebase: 'connected' | 'disconnected' | 'checking'
    youtube: 'connected' | 'disconnected' | 'checking'
    telegram: 'connected' | 'disconnected' | 'checking'
  }
}

export interface AppNotification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
}

export interface UIState {
  darkMode: boolean
  activeTab: 'videos' | 'channels'
  notifications: AppNotification[]
  sidebar: {
    isOpen: boolean
    width: number
  }
}

export interface RootState {
  videos: VideosState
  channels: ChannelsState
  player: PlayerState
  settings: SettingsState
  ui: UIState
}

// API types
export interface BulkNotificationUpdate {
  channelIds: string[]
  notify: boolean
}

// WebSocket event types
export interface WebSocketEvents {
  'video-discovered': { video: Video; channel: Channel }
  'video-interacted': { videoId: string; clickCount: number; isViewed: boolean }
  'channel-updated': { channel: Channel }
  'sync-completed': { stats: HeaderData }
  'favorite-toggled': { videoId: string; isFavorite: boolean }
}

// Component prop types
export interface VideoListProps {
  videos: Video[]
  dateRange: { start: Date; end: Date }
  searchTerm: string
  onVideoClick: (video: Video) => void
  onToggleFavorite: (videoId: string) => void
  onDeleteVideo: (videoId: string) => void
}

export interface ChannelListProps {
  channels: Channel[]
  onToggleNotification: (channelId: string) => void
  onBulkToggle: (channelIds: string[], notify: boolean) => void
  searchTerm: string
  filter: 'all' | 'notify-on' | 'notify-off'
  sortBy: 'name' | 'subscribers' | 'last_video'
  sortOrder: 'asc' | 'desc'
}

export interface VideoPlayerProps {
  player: PlayerState
  onClose: () => void
  onMinimize: () => void
  onPlayVideo: (url: string) => void
}

// Utility types
export type NotificationFilter = 'all' | 'notify-on' | 'notify-off'
export type ChannelSortBy = 'name' | 'subscribers' | 'last_video' | 'last_upload'
export type SortOrder = 'asc' | 'desc'
export type DateRange = { start: string; end: string }