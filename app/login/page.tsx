'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Video } from 'lucide-react'
import LoginForm from '@/components/auth/LoginForm'
import { useAuth } from '@/lib/firebase/auth'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
          <div className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              YouTube Bot Manager
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <LoginForm 
          onToggleMode={() => setIsSignUp(!isSignUp)} 
          isSignUp={isSignUp} 
        />
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 YouTube Bot Manager. Secure authentication powered by Firebase.
          </p>
        </div>
      </div>
    </div>
  )
}