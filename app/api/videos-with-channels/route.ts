import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { BatchVideoRequest, BatchVideoResponse, VideoWithChannel, CacheStats } from '@/types'
import { isFirebaseConfigured } from '@/lib/firebase/fallback'

// Initialize Firestore
let db: FirebaseFirestore.Firestore

function getDb() {
  if (!db) {
    db = getFirestore()
  }
  return db
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const videoIdsParam = searchParams.get('videoIds')
    const includeChannel = searchParams.get('includeChannel') !== 'false'
    const maxAge = parseInt(searchParams.get('maxAge') || '300') // 5 minutes default

    if (!videoIdsParam) {
      return NextResponse.json(
        { error: 'videoIds parameter is required' },
        { status: 400 }
      )
    }

    const videoIds = videoIdsParam.split(',').filter(id => id.trim())

    if (videoIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one video ID must be provided' },
        { status: 400 }
      )
    }

    if (videoIds.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 video IDs allowed per request' },
        { status: 400 }
      )
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: 'Firebase is not configured' },
        { status: 500 }
      )
    }

    const db = getDb()
    const cacheStats: CacheStats = {
      totalReads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      channelsFetched: 0,
      videosFetched: 0
    }

    const response = await db.runTransaction(async (transaction) => {
      // Batch fetch videos
      const videoRefs = videoIds.map(id => db.collection('videos').doc(id))
      const videoSnapshots = await transaction.getAll(...videoRefs)

      cacheStats.totalReads += videoSnapshots.length
      cacheStats.videosFetched = videoSnapshots.filter(snap => snap.exists).length

      const videos: VideoWithChannel[] = []
      const channelRefs = new Set<FirebaseFirestore.DocumentReference>()

      // Process video documents and collect unique channel references
      for (const videoSnapshot of videoSnapshots) {
        if (!videoSnapshot.exists) {
          continue
        }

        const videoData = videoSnapshot.data()
        if (!videoData) continue

        // Handle both new DocumentReference format and legacy channel_id format
        let channelRef: FirebaseFirestore.DocumentReference | null = null

        if (videoData.channel && typeof videoData.channel === 'object' && videoData.channel._path) {
          // New DocumentReference format
          channelRef = videoData.channel
        } else if (videoData.channel_id) {
          // Legacy format - create DocumentReference
          channelRef = db.collection('channels').doc(videoData.channel_id)
        }

        if (channelRef && includeChannel) {
          channelRefs.add(channelRef)
        }

        // Add video to results (channel will be populated later)
        videos.push({
          ...videoData,
          channel: null as any // Will be populated if includeChannel is true
        } as VideoWithChannel)
      }

      // Batch fetch unique channels if requested
      const channelData = new Map<string, any>()
      if (includeChannel && channelRefs.size > 0) {
        const uniqueChannelRefs = Array.from(channelRefs)
        const channelSnapshots = await transaction.getAll(...uniqueChannelRefs)

        cacheStats.totalReads += channelSnapshots.length
        cacheStats.channelsFetched = channelSnapshots.filter(snap => snap.exists).length

        channelSnapshots.forEach(channelSnapshot => {
          if (channelSnapshot.exists) {
            channelData.set(channelSnapshot.id, channelSnapshot.data())
          }
        })
      }

      // Merge channel data with videos
      if (includeChannel) {
        videos.forEach(video => {
          let channelId: string | null = null

          // Extract channel ID from DocumentReference or legacy field
          if (video.channel && typeof video.channel === 'object' && (video.channel as any)._path) {
            channelId = (video.channel as any)._path.segments[(video.channel as any)._path.segments.length - 1]
          } else if (video.channel_id) {
            channelId = video.channel_id
          }

          if (channelId && channelData.has(channelId)) {
            video.channel = channelData.get(channelId)
          } else {
            // Fallback to basic channel info from video document
            video.channel = {
              channel_id: video.channel_id,
              title: video.channel_title,
              thumbnail: video.channel_thumbnail,
              // Set default values for missing fields
              notify: false,
              subscriber_count: undefined,
              last_video_id: '',
              last_upload_at: undefined,
              subscribed_at: '',
              last_updated: '',
              rss_url: '',
              link: undefined
            }
          }
        })
      }

      return videos
    })

    const result: BatchVideoResponse = {
      videos: response,
      cacheStats
    }

    // Set cache headers
    const cacheControl = `public, s-maxage=${maxAge}, stale-while-revalidate=${Math.floor(maxAge / 2)}`

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': cacheControl,
        'CDN-Cache-Control': `public, s-maxage=${maxAge * 2}`,
        'Vercel-CDN-Cache-Control': `public, s-maxage=${maxAge * 4}`,
        'Content-Type': 'application/json',
        'X-Cache-Stats': JSON.stringify(cacheStats)
      }
    })

  } catch (error) {
    console.error('Error in videos-with-channels API:', error)

    // Handle specific Firebase errors
    if ((error as any)?.code === 'permission-denied' || (error as any)?.code === 'unauthenticated') {
      return NextResponse.json(
        { error: 'Firebase permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch videos with channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchVideoRequest = await request.json()

    if (!body.videoIds || !Array.isArray(body.videoIds)) {
      return NextResponse.json(
        { error: 'videoIds array is required in request body' },
        { status: 400 }
      )
    }

    if (body.videoIds.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 video IDs allowed per request' },
        { status: 400 }
      )
    }

    // Build query string and delegate to GET handler
    const searchParams = new URLSearchParams({
      videoIds: body.videoIds.join(','),
      includeChannel: String(body.includeChannel ?? true),
      maxAge: String(body.maxAge ?? 300)
    })

    const getRequest = new NextRequest(
      `${request.url}?${searchParams.toString()}`,
      { method: 'GET' }
    )

    return await GET(getRequest)

  } catch (error) {
    console.error('Error parsing POST request:', error)
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}