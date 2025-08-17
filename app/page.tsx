'use client'

import Header from '@/components/layout/Header'
import TabNavigation from '@/components/layout/TabNavigation'
import FirebaseStatus from '@/components/layout/FirebaseStatus'
import VideosTab from '@/components/videos/VideosTab'
import ChannelsTab from '@/components/channels/ChannelsTab'
import VideoPlayer from '@/components/videos/VideoPlayer'
import { useAppSelector } from '@/lib/redux/hooks'

export default function Home() {
  const activeTab = useAppSelector(state => state.ui.activeTab)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <TabNavigation />
      <FirebaseStatus />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'videos' ? <VideosTab /> : <ChannelsTab />}
      </main>

      <VideoPlayer />
    </div>
  )
}