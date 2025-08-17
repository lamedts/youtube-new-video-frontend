import { NextResponse } from 'next/server'
import { StatsService } from '@/lib/firebase/firestore'
import { isFirebaseConfigured } from '@/lib/firebase/fallback'

export async function GET() {
  try {
    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      console.error('Firebase not configured')
      return NextResponse.json(
        { error: 'Firebase is not configured. Please set up Firebase configuration.' },
        { status: 500 }
      )
    }

    const headerStats = await StatsService.getHeaderStats()
    return NextResponse.json(headerStats)
  } catch (error) {
    console.error('Error fetching header stats:', error)
    
    // If Firebase error, return error
    if ((error as any)?.code === 'permission-denied' || (error as any)?.code === 'unauthenticated') {
      console.error('Firebase permission error')
      return NextResponse.json(
        { error: 'Firebase permission denied. Please check your Firebase configuration.' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch header stats' },
      { status: 500 }
    )
  }
}