import { NextRequest, NextResponse } from 'next/server'
import { VideoService } from '@/lib/firebase/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    await VideoService.toggleVideoFavorite(videoId)
    
    console.log(`Toggled favorite status for video: ${videoId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Video favorite status updated',
      videoId 
    })
  } catch (error) {
    console.error('Error toggling video favorite:', error)
    return NextResponse.json(
      { error: 'Failed to toggle video favorite status' },
      { status: 500 }
    )
  }
}