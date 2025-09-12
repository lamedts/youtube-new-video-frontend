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
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    
    // For now, just return first page - you can implement cursor-based pagination later
    const result = await VideoService.getVideos(filters, pageSize)
    
    // Return in the format the frontend expects
    return NextResponse.json(result.videos)
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
