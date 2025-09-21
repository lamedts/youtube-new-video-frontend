#!/usr/bin/env node

/**
 * Migration script to convert channel_id strings to DocumentReferences in video documents
 *
 * Usage:
 *   node scripts/migrate-video-channel-refs.js [--dry-run] [--batch-size=100] [--resume-from=batchId]
 *
 * This script:
 * 1. Reads all video documents in batches
 * 2. Validates that the referenced channels exist
 * 3. Adds DocumentReference field while keeping original channel_id
 * 4. Provides rollback capability and progress tracking
 */

const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  batchSize: parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 100,
  dryRun: process.argv.includes('--dry-run'),
  resumeFrom: process.argv.find(arg => arg.startsWith('--resume-from='))?.split('=')[1] || null,
  logFile: `migration-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
}

let db
let migrationLog = {
  startTime: new Date().toISOString(),
  config: CONFIG,
  batches: [],
  stats: {
    totalVideos: 0,
    processedVideos: 0,
    updatedVideos: 0,
    skippedVideos: 0,
    errors: 0
  }
}

async function initializeFirebase() {
  try {
    // Initialize Firebase Admin
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || './firebase-service-account.json'

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(`Firebase service account file not found: ${serviceAccountPath}`)
    }

    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    })

    db = getFirestore()
    console.log('✅ Firebase initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message)
    process.exit(1)
  }
}

async function validateChannelExists(channelId) {
  try {
    const channelDoc = await db.collection('channels').doc(channelId).get()
    return channelDoc.exists
  } catch (error) {
    console.error(`❌ Error checking channel ${channelId}:`, error.message)
    return false
  }
}

async function processBatch(videos, batchNumber) {
  const batchLog = {
    batchNumber,
    startTime: new Date().toISOString(),
    videoIds: videos.map(v => v.id),
    results: [],
    errors: []
  }

  console.log(`\n📦 Processing batch ${batchNumber} (${videos.length} videos)...`)

  const batch = db.batch()
  let batchOperations = 0

  for (const videoDoc of videos) {
    const video = videoDoc.data()
    const videoId = videoDoc.id

    try {
      // Skip if already has DocumentReference
      if (video.channel && typeof video.channel === 'object' && video.channel._path) {
        console.log(`⏭️  Skipping ${videoId} - already has DocumentReference`)
        batchLog.results.push({ videoId, action: 'skipped', reason: 'already-migrated' })
        migrationLog.stats.skippedVideos++
        continue
      }

      // Validate channel exists
      const channelExists = await validateChannelExists(video.channel_id)
      if (!channelExists) {
        console.log(`⚠️  Channel ${video.channel_id} not found for video ${videoId}`)
        batchLog.errors.push({ videoId, error: 'channel-not-found', channelId: video.channel_id })
        migrationLog.stats.errors++
        continue
      }

      // Create DocumentReference
      const channelRef = db.collection('channels').doc(video.channel_id)

      if (!CONFIG.dryRun) {
        // Update video document with DocumentReference
        batch.update(videoDoc.ref, {
          channel: channelRef,
          // Keep original fields for backward compatibility
          channel_id: video.channel_id,
          channel_title: video.channel_title,
          // Add migration metadata
          migrated_at: new Date(),
          migration_version: '1.0'
        })
        batchOperations++
      }

      batchLog.results.push({
        videoId,
        action: CONFIG.dryRun ? 'would-update' : 'updated',
        channelId: video.channel_id
      })
      migrationLog.stats.updatedVideos++

      console.log(`✅ ${CONFIG.dryRun ? 'Would update' : 'Updated'} ${videoId} -> channel/${video.channel_id}`)

    } catch (error) {
      console.error(`❌ Error processing video ${videoId}:`, error.message)
      batchLog.errors.push({ videoId, error: error.message })
      migrationLog.stats.errors++
    }
  }

  // Commit batch if not dry run
  if (!CONFIG.dryRun && batchOperations > 0) {
    try {
      await batch.commit()
      console.log(`✅ Committed batch ${batchNumber} (${batchOperations} operations)`)
    } catch (error) {
      console.error(`❌ Failed to commit batch ${batchNumber}:`, error.message)
      batchLog.errors.push({ error: `batch-commit-failed: ${error.message}` })
    }
  }

  batchLog.endTime = new Date().toISOString()
  batchLog.operationCount = batchOperations
  migrationLog.batches.push(batchLog)

  // Save progress
  fs.writeFileSync(CONFIG.logFile, JSON.stringify(migrationLog, null, 2))

  return batchLog
}

async function runMigration() {
  console.log('🚀 Starting video-channel DocumentReference migration...')
  console.log(`📊 Configuration:`, CONFIG)

  try {
    // Get total count
    const videosCountSnapshot = await db.collection('videos').count().get()
    migrationLog.stats.totalVideos = videosCountSnapshot.data().count
    console.log(`📹 Total videos to process: ${migrationLog.stats.totalVideos}`)

    // Process in batches
    let query = db.collection('videos').limit(CONFIG.batchSize)
    let lastDoc = null
    let batchNumber = 1

    // Resume from specific batch if specified
    if (CONFIG.resumeFrom) {
      console.log(`🔄 Resuming from batch: ${CONFIG.resumeFrom}`)
      batchNumber = parseInt(CONFIG.resumeFrom)
    }

    while (true) {
      const snapshot = lastDoc
        ? await query.startAfter(lastDoc).get()
        : await query.get()

      if (snapshot.empty) {
        console.log('✅ No more videos to process')
        break
      }

      await processBatch(snapshot.docs, batchNumber)
      migrationLog.stats.processedVideos += snapshot.docs.length

      lastDoc = snapshot.docs[snapshot.docs.length - 1]
      batchNumber++

      // Rate limiting - wait 1 second between batches
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    migrationLog.error = error.message
  } finally {
    migrationLog.endTime = new Date().toISOString()
    migrationLog.duration = new Date(migrationLog.endTime) - new Date(migrationLog.startTime)

    // Final log save
    fs.writeFileSync(CONFIG.logFile, JSON.stringify(migrationLog, null, 2))

    console.log('\n📊 Migration Summary:')
    console.log(`   Total videos: ${migrationLog.stats.totalVideos}`)
    console.log(`   Processed: ${migrationLog.stats.processedVideos}`)
    console.log(`   Updated: ${migrationLog.stats.updatedVideos}`)
    console.log(`   Skipped: ${migrationLog.stats.skippedVideos}`)
    console.log(`   Errors: ${migrationLog.stats.errors}`)
    console.log(`   Duration: ${Math.round(migrationLog.duration / 1000)}s`)
    console.log(`   Log file: ${CONFIG.logFile}`)

    if (CONFIG.dryRun) {
      console.log('\n🔍 This was a dry run. No changes were made.')
      console.log('   Remove --dry-run flag to execute the migration.')
    }
  }
}

async function rollbackMigration() {
  console.log('🔄 Starting rollback of DocumentReference migration...')

  try {
    let query = db.collection('videos').where('migrated_at', '!=', null).limit(CONFIG.batchSize)
    let batchNumber = 1

    while (true) {
      const snapshot = await query.get()
      if (snapshot.empty) break

      const batch = db.batch()

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          channel: admin.firestore.FieldValue.delete(),
          migrated_at: admin.firestore.FieldValue.delete(),
          migration_version: admin.firestore.FieldValue.delete()
        })
      })

      if (!CONFIG.dryRun) {
        await batch.commit()
      }

      console.log(`✅ ${CONFIG.dryRun ? 'Would rollback' : 'Rolled back'} batch ${batchNumber}`)
      batchNumber++
    }

    console.log('✅ Rollback completed')
  } catch (error) {
    console.error('❌ Rollback failed:', error.message)
  }
}

// Main execution
async function main() {
  await initializeFirebase()

  if (process.argv.includes('--rollback')) {
    await rollbackMigration()
  } else {
    await runMigration()
  }

  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}

module.exports = { runMigration, rollbackMigration }