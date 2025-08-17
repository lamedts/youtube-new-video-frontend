import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '@/lib/firebase/firestore'

export async function GET() {
  try {
    const settings = await SettingsService.getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    
    await SettingsService.updateSettings(updates)
    console.log('Updated bot settings:', updates)

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}