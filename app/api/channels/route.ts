import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/firebase/firestore'
import { ChannelFilters } from '@/types'
import { isFirebaseConfigured } from '@/lib/firebase/fallback'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: ChannelFilters = {
      searchTerm: searchParams.get('searchTerm') || '',
      notificationFilter: (searchParams.get('notificationFilter') as 'all' | 'notify-on' | 'notify-off') || 'all',
      sortBy: (searchParams.get('sortBy') as 'name' | 'subscribers' | 'last_video') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
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
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    
    // For now, just return first page - you can implement cursor-based pagination later
    const result = await ChannelService.getChannels(filters, pageSize)
    
    // Return in the format the frontend expects
    return NextResponse.json(result.channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    
    // If Firebase error, return error
    if ((error as any)?.code === 'permission-denied' || (error as any)?.code === 'unauthenticated') {
      console.error('Firebase permission error')
      return NextResponse.json(
        { error: 'Firebase permission denied. Please check your Firebase configuration.' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const channelData = await request.json()
    const channelId = await ChannelService.createChannel(channelData)
    
    return NextResponse.json(
      { success: true, channelId, message: 'Channel created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}