import { NextRequest, NextResponse } from 'next/server'
import { VideoService } from '@/lib/firebase/firestore'
import { VideoFilters } from '@/types'
import { isFirebaseConfigured } from '@/lib/firebase/fallback'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: VideoFilters = {
      searchTerm: searchParams.get('searchTerm') || '',
      showFavoritesOnly: searchParams.get('showFavoritesOnly') === 'true',
      showUnviewedOnly: searchParams.get('showUnviewedOnly') === 'true',
      dateRange: {
        start: searchParams.get('start') || '',
        end: searchParams.get('end') || ''
      }
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase not configured')
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set up Firebase configuration.' },
        { status: 500 }
      )
    }

    // Get pagination parameters  
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Calculate offset for page-based pagination
    const offset = (page - 1) * limit
    
    const result = await VideoService.getVideosWithPagePagination(filters, limit, offset)
    
    // Return full pagination response
    return NextResponse.json({
      videos: result.videos,
      total: result.total,
      page: page,
      limit: limit,
      hasMore: (offset + result.videos.length) < result.total
    })
  } catch (error) {
    console.error('Error fetching videos:', error)

    // If Firebase error, return error
    if ((error as any)?.code === 'permission-denied' || (error as any)?.code === 'unauthenticated') {
      console.error('Firebase permission error')
      return NextResponse.json(
        { error: 'Firebase permission denied. Please check your Firebase configuration.' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const videoData = await request.json()
    const videoId = await VideoService.createVideo(videoData)

    return NextResponse.json(
      { success: true, videoId, message: 'Video created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
