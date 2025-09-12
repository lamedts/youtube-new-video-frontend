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
  startAfter,
  getCountFromServer,
  Timestamp,
  DocumentData,
  QueryConstraint,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from './config'
import { Video, Channel, VideoFilters, ChannelFilters } from '@/types'

// Cache for reducing duplicate reads
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class FirestoreCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Skip caching during build/SSR to avoid issues
    if (typeof window === 'undefined') return
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    // Skip caching during build/SSR to avoid issues
    if (typeof window === 'undefined') return null
    
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(keyPrefix?: string): void {
    // Skip caching during build/SSR to avoid issues
    if (typeof window === 'undefined') return
    
    if (keyPrefix) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPrefix)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}

const cache = new FirestoreCache()

// Export cache for manual clearing if needed
export { cache }

// Collection names
export const COLLECTIONS = {
  VIDEOS: 'videos',
  CHANNELS: 'subscriptions',
  SETTINGS: 'bot_state',
  STATS: 'stats'
} as const

// Video operations
export class VideoService {
  static async getVideos(
    filters: VideoFilters, 
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot
  ): Promise<{ videos: Video[], hasMore: boolean, lastDoc?: DocumentSnapshot }> {
    try {
      // Create cache key based on filters and pagination
      const cacheKey = `videos:${JSON.stringify(filters)}:${pageSize}:${lastDoc?.id || 'first'}`
      const cached = cache.get<{ videos: Video[], hasMore: boolean, lastDoc?: DocumentSnapshot }>(cacheKey)
      if (cached) {
        return cached
      }

      const videosRef = collection(db, COLLECTIONS.VIDEOS)
      const constraints: QueryConstraint[] = []

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
      
      // Add pagination
      constraints.push(limit(pageSize + 1)) // Get one extra to check if there are more
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      const q = query(videosRef, ...constraints)
      const querySnapshot = await getDocs(q)

      const docs = querySnapshot.docs
      const hasMore = docs.length > pageSize
      const videoDocs = hasMore ? docs.slice(0, -1) : docs
      const newLastDoc = videoDocs.length > 0 ? videoDocs[videoDocs.length - 1] : undefined

      let videos = videoDocs.map(doc => ({
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

      const result = { videos, hasMore, lastDoc: newLastDoc }
      
      // Cache for 2 minutes to reduce duplicate queries
      cache.set(cacheKey, result, 2 * 60 * 1000)
      
      return result
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
      
      // Clear relevant caches when data changes
      cache.clear('videos:')
      cache.clear('header-stats')
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
      
      // Clear caches when data changes
      cache.clear('videos:')
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
  static async getChannels(
    filters: ChannelFilters, 
    pageSize: number = 50,
    lastDoc?: DocumentSnapshot
  ): Promise<{ channels: Channel[], hasMore: boolean, lastDoc?: DocumentSnapshot }> {
    try {
      // Create cache key
      const cacheKey = `channels:${JSON.stringify(filters)}:${pageSize}:${lastDoc?.id || 'first'}`
      const cached = cache.get<{ channels: Channel[], hasMore: boolean, lastDoc?: DocumentSnapshot }>(cacheKey)
      if (cached) {
        return cached
      }

      const channelsRef = collection(db, COLLECTIONS.CHANNELS)
      const constraints: QueryConstraint[] = []

      // Add notification filter
      if (filters.notificationFilter === 'notify-on') {
        constraints.push(where('notify', '==', true))
      } else if (filters.notificationFilter === 'notify-off') {
        constraints.push(where('notify', '==', false))
      }

      // Add sorting
      let orderByField = 'title'
      if (filters.sortBy === 'last_video' || filters.sortBy === 'last_upload') {
        orderByField = 'last_upload_at'
      } else if (filters.sortBy === 'subscribers') {
        orderByField = 'subscriber_count'
      }

      constraints.push(orderBy(orderByField, filters.sortOrder))
      
      // Add pagination
      constraints.push(limit(pageSize + 1))
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc))
      }

      const q = query(channelsRef, ...constraints)
      const querySnapshot = await getDocs(q)

      const docs = querySnapshot.docs
      const hasMore = docs.length > pageSize
      const channelDocs = hasMore ? docs.slice(0, -1) : docs
      const newLastDoc = channelDocs.length > 0 ? channelDocs[channelDocs.length - 1] : undefined

      let channels = channelDocs.map(doc => ({
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

      const result = { channels, hasMore, lastDoc: newLastDoc }
      
      // Cache for 3 minutes
      cache.set(cacheKey, result, 3 * 60 * 1000)
      
      return result
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

          // Return in the expected paginated format for fallback
          const result = { 
            channels, 
            hasMore: channels.length >= pageSize, // Assume more if we hit the limit
            lastDoc: undefined // Fallback doesn't support pagination
          }
          return result
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
      
      // Clear caches when notification settings change
      cache.clear('channels:')
      cache.clear('header-stats')
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
      // Check cache first - stats don't change often
      const cacheKey = 'header-stats'
      const cached = cache.get<{ stats: any, lastSyncTime: string }>(cacheKey)
      if (cached) {
        return cached
      }

      const channelsRef = collection(db, COLLECTIONS.CHANNELS)
      const videosRef = collection(db, COLLECTIONS.VIDEOS)

      // Try efficient counting first, fallback to document counting if needed
      let totalChannelsCount: number, enabledChannelsCount: number, totalVideosCount: number, newVideosCount: number

      try {
        // Use getCountFromServer for much better performance
        const [tcc, ecc, tvc] = await Promise.all([
          getCountFromServer(channelsRef),
          getCountFromServer(query(channelsRef, where('notify', '==', true))),
          getCountFromServer(videosRef)
        ])
        
        totalChannelsCount = tcc.data().count
        enabledChannelsCount = ecc.data().count
        totalVideosCount = tvc.data().count
        
        // For new videos, we need to count documents since getCountFromServer 
        // doesn't handle complex OR conditions well
        const allVideosSnap = await getDocs(query(videosRef, limit(1000)))
        newVideosCount = 0
        allVideosSnap.docs.forEach(doc => {
          const data = doc.data()
          const isViewed = data.is_viewed
          const clickCount = data.click_count
          
          // Consider a video "new" if:
          // - is_viewed is false, null, or undefined  
          // - OR click_count is 0, null, or undefined
          if (!isViewed || clickCount === 0 || clickCount === null || clickCount === undefined) {
            newVideosCount++
          }
        })
        
      } catch (countError) {
        console.warn('getCountFromServer failed, falling back to document counting:', countError)
        
        // Fallback: Load limited documents for counting
        const [allChannelsSnap, enabledChannelsSnap, allVideosSnap] = await Promise.all([
          getDocs(query(channelsRef, limit(1000))),
          getDocs(query(channelsRef, where('notify', '==', true), limit(1000))),
          getDocs(query(videosRef, limit(1000)))
        ])
        
        totalChannelsCount = allChannelsSnap.size
        enabledChannelsCount = enabledChannelsSnap.size
        totalVideosCount = allVideosSnap.size
        
        // Count new videos
        newVideosCount = 0
        allVideosSnap.docs.forEach(doc => {
          const data = doc.data()
          const isViewed = data.is_viewed
          const clickCount = data.click_count
          
          if (!isViewed || clickCount === 0 || clickCount === null || clickCount === undefined) {
            newVideosCount++
          }
        })
      }

      // Get bot state for last sync time (only 1 document read)
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

      const result = {
        stats: {
          enabledChannels: enabledChannelsCount,
          totalChannels: totalChannelsCount,
          newVideos: newVideosCount,
          totalVideos: totalVideosCount
        },
        lastSyncTime
      }

      // Cache for 10 minutes - stats don't change frequently
      cache.set(cacheKey, result, 10 * 60 * 1000)
      
      return result
    } catch (error) {
      console.error('Error fetching header stats:', error)
      
      // Fallback to old method if getCountFromServer fails
      try {
        console.warn('Falling back to document counting method')
        
        const channelsRef = collection(db, COLLECTIONS.CHANNELS)
        const videosRef = collection(db, COLLECTIONS.VIDEOS)
        
        // At least limit the fallback queries
        const [allChannelsSnap, enabledChannelsSnap, allVideosSnap] = await Promise.all([
          getDocs(query(channelsRef, limit(1000))), // Limit to prevent huge reads
          getDocs(query(channelsRef, where('notify', '==', true), limit(1000))),
          getDocs(query(videosRef, limit(1000)))
        ])
        
        // Count unviewed videos from limited set
        let newVideosCount = 0
        allVideosSnap.docs.forEach(doc => {
          const data = doc.data()
          if (!data.is_viewed) {
            newVideosCount++
          }
        })

        return {
          stats: {
            enabledChannels: enabledChannelsSnap.size,
            totalChannels: allChannelsSnap.size,
            newVideos: newVideosCount,
            totalVideos: allVideosSnap.size
          },
          lastSyncTime: '-'
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError)
        throw new Error('Failed to fetch header stats')
      }
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
