import { NextResponse } from 'next/server'

export async function GET() {
  // Mock bot status data
  const botStatus = {
    isRunning: true,
    lastSync: '2024-08-16T14:30:25Z',
    uptime: 86400 // seconds
  }

  return NextResponse.json(botStatus)
}