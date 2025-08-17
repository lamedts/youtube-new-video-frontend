import { NextRequest, NextResponse } from 'next/server'
import { ChannelService } from '@/lib/firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelIds, notify } = body

    if (!Array.isArray(channelIds) || typeof notify !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. channelIds must be an array and notify must be a boolean.' },
        { status: 400 }
      )
    }

    await ChannelService.bulkUpdateNotifications(channelIds, notify)
    
    console.log(`Bulk updated notification status for channels: ${channelIds.join(', ')} to ${notify}`)

    return NextResponse.json({ 
      success: true, 
      message: `Bulk notification update completed for ${channelIds.length} channels`,
      channelIds,
      notify
    })
  } catch (error) {
    console.error('Error bulk updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to bulk update notifications' },
      { status: 500 }
    )
  }
}