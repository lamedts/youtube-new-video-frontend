'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import TabNavigation from '@/components/layout/TabNavigation'
import FirebaseStatus from '@/components/layout/FirebaseStatus'
import ChannelsTab from '@/components/channels/ChannelsTab'
import VideoPlayer from '@/components/videos/VideoPlayer'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setActiveTab } from '@/lib/redux/slices/uiSlice'
import { useAuth } from '@/lib/firebase/auth'

export default function ChannelsPage() {
  const dispatch = useAppDispatch()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    dispatch(setActiveTab('channels'))
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <TabNavigation />
      <FirebaseStatus />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ChannelsTab />
      </main>

      <VideoPlayer />
    </div>
  )
}