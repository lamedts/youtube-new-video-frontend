/**
 * Multi-level caching system for videos and channels
 *
 * Features:
 * - LRU eviction with configurable size limits
 * - Time-based expiration (TTL)
 * - Hit/miss tracking for performance monitoring
 * - Smart batch fetching with cache awareness
 * - Memory management and cleanup
 */

import { VideoWithChannel, Channel, CacheEntry, CacheStats, BatchVideoResponse } from '@/types'

interface CacheConfig {
  videoMaxSize: number
  channelMaxSize: number
  defaultTTL: number // seconds
  cleanupInterval: number // seconds
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check TTL
    const now = Date.now()
    if (now - entry.timestamp > this.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    entry.hits++
    this.cache.set(key, entry)

    return entry.data
  }

  set(key: string, data: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    // Remove existing entry if updating
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    // Add new entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    })
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check TTL
    const now = Date.now()
    if (now - entry.timestamp > this.ttl * 1000) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  getStats(): { size: number; hits: number; memory: number } {
    let totalHits = 0
    let memoryUsage = 0

    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      memoryUsage += JSON.stringify(entry).length * 2 // rough estimate
    }

    return {
      size: this.cache.size,
      hits: totalHits,
      memory: memoryUsage
    }
  }

  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl * 1000) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

export class VideoChannelCache {
  private videoCache: LRUCache<VideoWithChannel>
  private channelCache: LRUCache<Channel>
  private config: CacheConfig
  private cleanupTimer: NodeJS.Timeout | null = null
  private stats: CacheStats

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      videoMaxSize: 1000,
      channelMaxSize: 500,
      defaultTTL: 300, // 5 minutes
      cleanupInterval: 60, // 1 minute
      ...config
    }

    this.videoCache = new LRUCache<VideoWithChannel>(
      this.config.videoMaxSize,
      this.config.defaultTTL
    )

    this.channelCache = new LRUCache<Channel>(
      this.config.channelMaxSize,
      this.config.defaultTTL
    )

    this.stats = {
      totalReads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      channelsFetched: 0,
      videosFetched: 0
    }

    this.startCleanupTimer()
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.videoCache.cleanup()
      this.channelCache.cleanup()
    }, this.config.cleanupInterval * 1000)
  }

  /**
   * Get videos with intelligent cache checking
   */
  async getVideos(videoIds: string[]): Promise<VideoWithChannel[]> {
    const result: VideoWithChannel[] = []
    const uncachedVideoIds: string[] = []

    // Check video cache first
    for (const videoId of videoIds) {
      const cachedVideo = this.videoCache.get(videoId)
      if (cachedVideo) {
        result.push(cachedVideo)
        this.stats.cacheHits++
      } else {
        uncachedVideoIds.push(videoId)
        this.stats.cacheMisses++
      }
    }

    // Fetch uncached videos
    if (uncachedVideoIds.length > 0) {
      const fetchedVideos = await this.fetchVideosWithChannels(uncachedVideoIds)

      // Cache the fetched videos
      fetchedVideos.videos.forEach(video => {
        this.videoCache.set(video.video_id, video)

        // Also cache the channel data separately for sharing
        if (video.channel) {
          this.channelCache.set(video.channel.channel_id, video.channel)
        }
      })

      result.push(...fetchedVideos.videos)

      // Update stats
      this.stats.totalReads += fetchedVideos.cacheStats.totalReads
      this.stats.channelsFetched += fetchedVideos.cacheStats.channelsFetched
      this.stats.videosFetched += fetchedVideos.cacheStats.videosFetched
    }

    return result
  }

  /**
   * Get single video with cache check
   */
  async getVideo(videoId: string): Promise<VideoWithChannel | null> {
    const videos = await this.getVideos([videoId])
    return videos[0] || null
  }

  /**
   * Get channel data with cache check
   */
  getChannel(channelId: string): Channel | null {
    const cached = this.channelCache.get(channelId)
    if (cached) {
      this.stats.cacheHits++
      return cached
    }

    this.stats.cacheMisses++
    return null
  }

  /**
   * Cache channel data
   */
  setChannel(channelId: string, channel: Channel): void {
    this.channelCache.set(channelId, channel)
  }

  /**
   * Cache video data
   */
  setVideo(videoId: string, video: VideoWithChannel): void {
    this.videoCache.set(videoId, video)

    // Also cache the channel if present
    if (video.channel) {
      this.channelCache.set(video.channel.channel_id, video.channel)
    }
  }

  /**
   * Invalidate cache entries
   */
  invalidateVideo(videoId: string): void {
    this.videoCache.delete(videoId)
  }

  invalidateChannel(channelId: string): void {
    this.channelCache.delete(channelId)

    // Also invalidate any videos that include this channel
    // Note: This is expensive, consider keeping a reverse index for production
    this.videoCache.clear() // Simple approach for now
  }

  /**
   * Prefetch videos that are likely to be accessed soon
   */
  async prefetchVideos(videoIds: string[]): Promise<void> {
    const uncachedIds = videoIds.filter(id => !this.videoCache.has(id))

    if (uncachedIds.length > 0) {
      // Fetch in background without blocking
      this.fetchVideosWithChannels(uncachedIds)
        .then(response => {
          response.videos.forEach(video => {
            this.videoCache.set(video.video_id, video)
            if (video.channel) {
              this.channelCache.set(video.channel.channel_id, video.channel)
            }
          })
        })
        .catch(error => {
          console.warn('Prefetch failed:', error)
        })
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & {
    video: ReturnType<LRUCache<VideoWithChannel>['getStats']>
    channel: ReturnType<LRUCache<Channel>['getStats']>
  } {
    return {
      ...this.stats,
      video: this.videoCache.getStats(),
      channel: this.channelCache.getStats()
    }
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.videoCache.clear()
    this.channelCache.clear()
    this.stats = {
      totalReads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      channelsFetched: 0,
      videosFetched: 0
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }

  /**
   * Private method to fetch videos from API
   */
  private async fetchVideosWithChannels(videoIds: string[]): Promise<BatchVideoResponse> {
    const response = await fetch(`/api/videos-with-channels?videoIds=${videoIds.join(',')}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.statusText}`)
    }

    return response.json()
  }
}

// Global cache instance
let globalCache: VideoChannelCache | null = null

export function getVideoChannelCache(): VideoChannelCache {
  if (!globalCache) {
    globalCache = new VideoChannelCache()
  }
  return globalCache
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalCache?.destroy()
  })
}