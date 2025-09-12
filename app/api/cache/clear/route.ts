import { NextResponse } from 'next/server'
import { cache } from '@/lib/firebase/firestore'

export async function POST() {
  try {
    cache.clear()
    return NextResponse.json({ success: true, message: 'Cache cleared successfully' })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    )
  }
}