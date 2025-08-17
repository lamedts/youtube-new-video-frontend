import { NextResponse } from 'next/server'
import { seedFirestoreData } from '@/lib/firebase/seedData'

export async function POST() {
  try {
    await seedFirestoreData()
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with sample data'
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}