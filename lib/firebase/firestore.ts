import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore'
import { db } from './config'
import { Video, Channel, VideoFilters, ChannelFilters } from '@/types'

// Collection names
export const COLLECTIONS = {
  VIDEOS: 'videos',
  CHANNELS: 'subscriptions',
  SETTINGS: 'bot_state',
  STATS: 'stats'
} as const

// Video operations
export class VideoService {
  static async getVideos(filters: VideoFilters): Promise<Video[]> {
    try {
      const videosRef = collection(db, COLLECTIONS.VIDEOS)
      const constraints: QueryConstraint[] = []

      // Don't add search filter to Firestore query - we'll filter client-side
      // to support searching both title and channel name

      // Add date range filters
      if (filters.dateRange.start) {
        constraints.push(where('published_at', '>=', new Date(filters.dateRange.start)))
      }
      if (filters.dateRange.end) {
        constraints.push(where('published_at', '<=', new Date(filters.dateRange.end)))
      }

      // Add favorites filter
      if (filters.showFavoritesOnly) {
        constraints.push(where('is_favorite', '==', true))
      }

      // Add unviewed filter
      if (filters.showUnviewedOnly) {
        constraints.push(where('is_viewed', '==', false))
      }

      // Order by publish date (newest first)
      constraints.push(orderBy('published_at', 'desc'))

      const q = query(videosRef, ...constraints)
      const querySnapshot = await getDocs(q)

      let videos = querySnapshot.docs.map(doc => ({
        video_id: doc.id,
        ...doc.data()
      } as Video))

      // Apply search filter client-side to search both title and channel name
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        videos = videos.filter(video => 
          video.title.toLowerCase().includes(searchTerm) ||
          video.channel_title.toLowerCase().includes(searchTerm)
        )
      }

      return videos
    } catch (error) {
      console.error('Error fetching videos:', error)
      throw new Error('Failed to fetch videos')
    }
  }

  static async getVideoById(videoId: string): Promise<Video | null> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId)
      const videoSnap = await getDoc(videoRef)

      if (!videoSnap.exists()) {
        return null
      }

      return {
        video_id: videoSnap.id,
        ...videoSnap.data()
      } as Video
    } catch (error) {
      console.error('Error fetching video:', error)
      throw new Error('Failed to fetch video')
    }
  }

  static async createVideo(videoData: Omit<Video, 'video_id'>): Promise<string> {
    try {
      const videosRef = collection(db, COLLECTIONS.VIDEOS)
      const docRef = await addDoc(videosRef, {
        ...videoData,
        discovered_at: videoData.discovered_at || new Date().toISOString(),
        click_count: videoData.click_count || 0,
        is_viewed: videoData.is_viewed || false,
        is_favorite: videoData.is_favorite || false
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating video:', error)
      throw new Error('Failed to create video')
    }
  }

  static async updateVideoClick(videoId: string): Promise<void> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId)
      const videoSnap = await getDoc(videoRef)

      if (!videoSnap.exists()) {
        throw new Error('Video not found')
      }

      const currentCount = videoSnap.data().click_count || 0
      await updateDoc(videoRef, {
        click_count: currentCount + 1,
        is_viewed: true,
        last_viewed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating video click:', error)
      throw new Error('Failed to update video click')
    }
  }

  static async toggleVideoFavorite(videoId: string): Promise<void> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId)
      const videoSnap = await getDoc(videoRef)

      if (!videoSnap.exists()) {
        throw new Error('Video not found')
      }

      const currentFavorite = videoSnap.data().is_favorite || false
      await updateDoc(videoRef, {
        is_favorite: !currentFavorite
      })
    } catch (error) {
      console.error('Error toggling video favorite:', error)
      throw new Error('Failed to toggle video favorite')
    }
  }

  static async deleteVideo(videoId: string): Promise<void> {
    try {
      const videoRef = doc(db, COLLECTIONS.VIDEOS, videoId)
      await deleteDoc(videoRef)
    } catch (error) {
      console.error('Error deleting video:', error)
      throw new Error('Failed to delete video')
    }
  }
}

// Channel operations
export class ChannelService {
  static async getChannels(filters: ChannelFilters): Promise<Channel[]> {
    try {
      const channelsRef = collection(db, COLLECTIONS.CHANNELS)
      const constraints: QueryConstraint[] = []

      // Add notification filter
      if (filters.notificationFilter === 'notify-on') {
        constraints.push(where('notify', '==', true))
      } else if (filters.notificationFilter === 'notify-off') {
        constraints.push(where('notify', '==', false))
      }

      // Don't add search filter to Firestore query - we'll filter client-side
      // for better search functionality

      // Add sorting
      let orderByField = 'title'
      if (filters.sortBy === 'last_video' || filters.sortBy === 'last_upload') {
        orderByField = 'last_upload_at'
      } else if (filters.sortBy === 'subscribers') {
        orderByField = 'subscriber_count'
      }

      constraints.push(orderBy(orderByField, filters.sortOrder))

      const q = query(channelsRef, ...constraints)
      const querySnapshot = await getDocs(q)

      let channels = querySnapshot.docs.map(doc => ({
        channel_id: doc.id,
        ...doc.data()
      } as Channel))

      // Apply search filter client-side for better partial matching
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        channels = channels.filter(channel => 
          channel.title.toLowerCase().includes(searchTerm)
        )
      }

      return channels
    } catch (error) {
      console.error('Error fetching channels:', error)
      
      // If the error is due to missing index, try without sorting
      if ((error as any).code === 'failed-precondition') {
        console.warn('Firestore index missing for sorting, falling back to unsorted results')
        try {
          const channelsRef = collection(db, COLLECTIONS.CHANNELS)
          const constraints: QueryConstraint[] = []

          // Add notification filter
          if (filters.notificationFilter === 'notify-on') {
            constraints.push(where('notify', '==', true))
          } else if (filters.notificationFilter === 'notify-off') {
            constraints.push(where('notify', '==', false))
          }

          const q = query(channelsRef, ...constraints)
          const querySnapshot = await getDocs(q)

          let channels = querySnapshot.docs.map(doc => ({
            channel_id: doc.id,
            ...doc.data()
          } as Channel))

          // Apply search filter client-side
          if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase()
            channels = channels.filter(channel => 
              channel.title.toLowerCase().includes(searchTerm)
            )
          }

          return channels
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError)
          throw new Error('Failed to fetch channels')
        }
      }
      
      throw new Error('Failed to fetch channels')
    }
  }

  static async getChannelById(channelId: string): Promise<Channel | null> {
    try {
      const channelRef = doc(db, COLLECTIONS.CHANNELS, channelId)
      const channelSnap = await getDoc(channelRef)

      if (!channelSnap.exists()) {
        return null
      }

      return {
        channel_id: channelSnap.id,
        ...channelSnap.data()
      } as Channel
    } catch (error) {
      console.error('Error fetching channel:', error)
      throw new Error('Failed to fetch channel')
    }
  }

  static async createChannel(channelData: Omit<Channel, 'channel_id'>): Promise<string> {
    try {
      const channelsRef = collection(db, COLLECTIONS.CHANNELS)
      const docRef = await addDoc(channelsRef, {
        ...channelData,
        subscribed_at: channelData.subscribed_at || new Date().toISOString(),
        last_updated: new Date().toISOString(),
        notify: channelData.notify || false
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating channel:', error)
      throw new Error('Failed to create channel')
    }
  }

  static async toggleChannelNotification(channelId: string): Promise<void> {
    try {
      const channelRef = doc(db, COLLECTIONS.CHANNELS, channelId)
      const channelSnap = await getDoc(channelRef)

      if (!channelSnap.exists()) {
        throw new Error('Channel not found')
      }

      const currentNotify = channelSnap.data().notify || false
      await updateDoc(channelRef, {
        notify: !currentNotify,
        last_updated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error toggling channel notification:', error)
      throw new Error('Failed to toggle channel notification')
    }
  }

  static async bulkUpdateNotifications(channelIds: string[], notify: boolean): Promise<void> {
    try {
      const updatePromises = channelIds.map(async (channelId) => {
        const channelRef = doc(db, COLLECTIONS.CHANNELS, channelId)
        return updateDoc(channelRef, {
          notify,
          last_updated: new Date().toISOString()
        })
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error bulk updating notifications:', error)
      throw new Error('Failed to bulk update notifications')
    }
  }

  static async deleteChannel(channelId: string): Promise<void> {
    try {
      const channelRef = doc(db, COLLECTIONS.CHANNELS, channelId)
      await deleteDoc(channelRef)
    } catch (error) {
      console.error('Error deleting channel:', error)
      throw new Error('Failed to delete channel')
    }
  }
}

// Stats operations
export class StatsService {
  static async getHeaderStats() {
    try {
      // Get total and enabled channels
      const channelsRef = collection(db, COLLECTIONS.CHANNELS)
      const allChannelsSnap = await getDocs(channelsRef)
      const enabledChannelsSnap = await getDocs(
        query(channelsRef, where('notify', '==', true))
      )

      // Get new videos (unviewed - click_count = 0 or null)
      const videosRef = collection(db, COLLECTIONS.VIDEOS)
      const allVideosSnap = await getDocs(videosRef)
      
      // Count videos with click_count = 0 or null (new videos)
      let newVideosCount = 0
      allVideosSnap.docs.forEach(doc => {
        const data = doc.data()
        const clickCount = data.click_count
        if (clickCount === 0 || clickCount === null || clickCount === undefined) {
          newVideosCount++
        }
      })

      // Get bot state for last sync time
      let lastSyncTime = '-'
      try {
        const botStateRef = doc(db, 'bot_state', 'sync_info')
        const botStateSnap = await getDoc(botStateRef)
        if (botStateSnap.exists()) {
          const botStateData = botStateSnap.data()
          lastSyncTime = botStateData.last_subs_sync || '-'
        }
      } catch (error) {
        console.warn('Could not fetch bot_state, using fallback:', error)
      }

      return {
        stats: {
          enabledChannels: enabledChannelsSnap.size,
          totalChannels: allChannelsSnap.size,
          newVideos: newVideosCount,
          totalVideos: allVideosSnap.size
        },
        lastSyncTime
      }
    } catch (error) {
      console.error('Error fetching header stats:', error)
      throw new Error('Failed to fetch header stats')
    }
  }
}

// Settings operations
export class SettingsService {
  static async getSettings() {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'bot-config')
      const settingsSnap = await getDoc(settingsRef)

      if (!settingsSnap.exists()) {
        // Return default settings if none exist
        return {
          telegram: { botToken: '', chatId: '' },
          youtube: { clientSecretFile: '', tokenFile: '' },
          firebase: { credentialsFile: '', projectId: '' },
          polling: { videoCheckIntervalSeconds: 300, subscriptionSyncIntervalMinutes: 60 },
          notifications: { initMode: false, globalNotificationsEnabled: true }
        }
      }

      return settingsSnap.data()
    } catch (error) {
      console.error('Error fetching settings:', error)
      throw new Error('Failed to fetch settings')
    }
  }

  static async updateSettings(settings: any): Promise<void> {
    try {
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'bot-config')
      await updateDoc(settingsRef, {
        ...settings,
        last_updated: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating settings:', error)
      throw new Error('Failed to update settings')
    }
  }
}
