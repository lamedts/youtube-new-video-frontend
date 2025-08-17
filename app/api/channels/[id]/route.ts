import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/firebase/firestore'
import { isFirebaseConfigured } from '@/lib/firebase/fallback'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase not configured')
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set up Firebase configuration.' },
        { status: 500 }
      )
    }

    const channel = await ChannelService.getChannelById(id)
    
    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(channel)
  } catch (error) {
    console.error('Error fetching channel:', error)
    
    // If Firebase error, return error
    if ((error as any)?.code === 'permission-denied' || (error as any)?.code === 'unauthenticated') {
      console.error('Firebase permission error')
      return NextResponse.json(
        { error: 'Firebase permission denied. Please check your Firebase configuration.' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch channel' },
      { status: 500 }
    )
  }
}