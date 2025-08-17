import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/firebase/firestore'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params

    await ChannelService.toggleChannelNotification(channelId)
    
    console.log(`Toggled notification status for channel: ${channelId}`)

    return NextResponse.json({ 
      success: true, 
      message: 'Channel notification status updated',
      channelId 
    })
  } catch (error) {
    console.error('Error toggling channel notification:', error)
    return NextResponse.json(
      { error: 'Failed to toggle channel notification status' },
      { status: 500 }
    )
  }
}