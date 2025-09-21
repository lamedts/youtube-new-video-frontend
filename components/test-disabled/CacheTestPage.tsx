/**
 * Test page for validating the DocumentReference + Cache implementation
 *
 * This component provides a testing interface to:
 * - Test the batch video-channel API endpoint
 * - Validate cache performance and behavior
 * - Compare legacy vs enhanced rendering modes
 * - Monitor Firebase read counts and cache efficiency
 */

'use client'

import { useState, useEffect } from 'react'
import { useVideoChannelCache, useCacheManagement } from '@/lib/hooks/useVideoChannelCache'
import { BatchVideoResponse } from '@/types'
import { Play, Database, Zap, RefreshCw, TestTube } from 'lucide-react'

export default function CacheTestPage() {
  const [testVideoIds, setTestVideoIds] = useState<string[]>([])
  const [apiTestResult, setApiTestResult] = useState<BatchVideoResponse | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isTestingApi, setIsTestingApi] = useState(false)

  // Test sample video IDs (you can replace these with actual video IDs from your database)
  const sampleVideoIds = [
    'video_1',
    'video_2',
    'video_3',
    'video_4',
    'video_5'
  ]

  // Cache hooks
  const { stats, clearCache, prefetchVideos } = useCacheManagement()
  const {
    videos: cachedVideos,
    loading: cacheLoading,
    error: cacheError,
    cacheStats,
    refetch,
    invalidate
  } = useVideoChannelCache(testVideoIds)

  // Test the batch API directly
  const testBatchApi = async () => {
    setIsTestingApi(true)
    setApiError(null)

    try {
      const response = await fetch(`/api/videos-with-channels?videoIds=${sampleVideoIds.join(',')}`)

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const data: BatchVideoResponse = await response.json()
      setApiTestResult(data)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsTestingApi(false)
    }
  }

  // Load sample videos for testing
  const loadSampleVideos = () => {
    setTestVideoIds(sampleVideoIds)
  }

  // Performance test: measure cache vs non-cache performance
  const [performanceTest, setPerformanceTest] = useState<{
    cacheTime: number
    noCacheTime: number
  } | null>(null)

  const runPerformanceTest = async () => {
    // Clear cache first
    clearCache()

    // Test 1: No cache (first load)
    const start1 = performance.now()
    await refetch()
    const noCacheTime = performance.now() - start1

    // Test 2: With cache (second load)
    const start2 = performance.now()
    await refetch()
    const cacheTime = performance.now() - start2

    setPerformanceTest({ cacheTime, noCacheTime })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Video-Channel Cache Test Suite
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test and validate the DocumentReference + Cache implementation
        </p>
      </div>

      {/* Cache Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-500" />
            Cache Statistics
          </h2>
          <button
            onClick={clearCache}
            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            Clear Cache
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-2xl font-bold text-blue-600">{stats.cacheHits}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cache Hits</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-2xl font-bold text-orange-600">{stats.cacheMisses}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cache Misses</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-2xl font-bold text-green-600">{stats.totalReads}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Firebase Reads</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {stats.cacheHits + stats.cacheMisses > 0
                ? Math.round((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Cache Efficiency</div>
          </div>
        </div>

        {cacheStats && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
            <strong>Last Query Stats:</strong> {cacheStats.videosFetched} videos, {cacheStats.channelsFetched} channels, {cacheStats.totalReads} reads
          </div>
        )}
      </div>

      {/* API Testing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <TestTube className="h-5 w-5 mr-2 text-green-500" />
          Batch API Testing
        </h2>

        <div className="space-y-4">
          <button
            onClick={testBatchApi}
            disabled={isTestingApi}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
          >
            {isTestingApi ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
            Test Batch API Endpoint
          </button>

          {apiTestResult && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
              <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">API Test Result</h3>
              <div className="text-sm text-green-700 dark:text-green-300">
                <div>Videos fetched: {apiTestResult.videos.length}</div>
                <div>Firebase reads: {apiTestResult.cacheStats.totalReads}</div>
                <div>Channels fetched: {apiTestResult.cacheStats.channelsFetched}</div>
              </div>
            </div>
          )}

          {apiError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">API Test Error</h3>
              <div className="text-sm text-red-700 dark:text-red-300">{apiError}</div>
            </div>
          )}
        </div>
      </div>

      {/* Cache Testing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
          <Zap className="h-5 w-5 mr-2 text-yellow-500" />
          Cache Performance Testing
        </h2>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={loadSampleVideos}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Load Sample Videos
            </button>
            <button
              onClick={() => prefetchVideos(sampleVideoIds)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Prefetch Videos
            </button>
            <button
              onClick={runPerformanceTest}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
            >
              Run Performance Test
            </button>
          </div>

          {performanceTest && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <h3 className="font-medium text-red-800 dark:text-red-200">No Cache (Cold)</h3>
                <div className="text-2xl font-bold text-red-600">{performanceTest.noCacheTime.toFixed(2)}ms</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                <h3 className="font-medium text-green-800 dark:text-green-200">With Cache (Warm)</h3>
                <div className="text-2xl font-bold text-green-600">{performanceTest.cacheTime.toFixed(2)}ms</div>
              </div>
            </div>
          )}

          {testVideoIds.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="font-medium mb-2">Current Test Videos ({testVideoIds.length})</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {testVideoIds.join(', ')}
              </div>
              {cacheLoading && <div className="mt-2 text-blue-600">Loading from cache...</div>}
              {cacheError && <div className="mt-2 text-red-600">Error: {cacheError}</div>}
              {cachedVideos.length > 0 && (
                <div className="mt-2 text-green-600">
                  ✅ Loaded {cachedVideos.length} videos with channel data
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Display */}
      {cachedVideos.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center mb-4">
            <Play className="h-5 w-5 mr-2 text-blue-500" />
            Cached Videos Preview
          </h2>
          <div className="space-y-3">
            {cachedVideos.slice(0, 3).map((video) => (
              <div key={video.video_id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="font-medium">{video.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Channel: {video.channel ? video.channel.title : 'Loading...'}
                  {video.channel?.thumbnail && ' • Has thumbnail'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}