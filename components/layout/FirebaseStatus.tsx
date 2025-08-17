'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Database, CheckCircle } from 'lucide-react'

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'fallback'>('checking')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check Firebase status by making a test API call
    const checkFirebaseStatus = async () => {
      try {
        const response = await fetch('/api/stats/header')
        const data = await response.json()
        
        // Check if we're getting fallback data
        if (response.headers.get('X-Fallback-Data') || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
          setStatus('fallback')
        } else {
          setStatus('connected')
        }
      } catch (error) {
        setStatus('fallback')
      }
    }

    checkFirebaseStatus()
  }, [])

  if (status === 'checking') {
    return null // Don't show anything while checking
  }

  if (status === 'connected') {
    return null // Don't show indicator when Firebase is working
  }

  // Show fallback indicator
  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-lg cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Demo Mode
          </span>
        </div>
        
        {showDetails && (
          <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
            <p>Using mock data. To enable Firebase:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Configure .env.local</li>
              <li>Set up Firestore rules</li>
              <li>Restart the server</li>
            </ol>
            <p className="mt-1">
              <a 
                href="/FIREBASE_SETUP.md" 
                target="_blank"
                className="underline hover:no-underline"
              >
                View setup guide
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}