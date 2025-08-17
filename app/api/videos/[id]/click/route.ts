import { NextRequest, NextResponse } from 'next/server'
import { VideoService } from '@/lib/firebase/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    await VideoService.updateVideoClick(videoId)
    
    console.log(`Incremented click count for video: ${videoId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Video click count updated',
      videoId 
    })
  } catch (error) {
    console.error('Error updating video click:', error)
    return NextResponse.json(
      { error: 'Failed to update video click count' },
      { status: 500 }
    )
  }
}