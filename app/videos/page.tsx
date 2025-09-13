'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'

// Force dynamic rendering to avoid SSG issues with Firebase
export const dynamic = 'force-dynamic'
import TabNavigation from '@/components/layout/TabNavigation'
import FirebaseStatus from '@/components/layout/FirebaseStatus'
import VideosTab from '@/components/videos/VideosTab'
import VideoPlayer from '@/components/videos/VideoPlayer'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setActiveTab } from '@/lib/redux/slices/uiSlice'
import { useAuth } from '@/lib/firebase/auth'

export default function VideosPage() {
  const dispatch = useAppDispatch()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    dispatch(setActiveTab('videos'))
  }, [dispatch])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <TabNavigation />
      <FirebaseStatus />
      
      <main className="flex-1 overflow-hidden">
        <VideosTab />
      </main>

      <VideoPlayer />
    </div>
  )
}