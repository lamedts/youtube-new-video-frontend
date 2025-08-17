# Firebase Setup Guide

This guide will walk you through setting up Firebase for the YouTube Bot Manager.

## 🚀 Quick Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `youtube-bot-manager`
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to you)
5. Click "Done"

### Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon (`</>`)
4. Register app name: `youtube-bot-manager-web`
5. Copy the configuration object

### Step 4: Configure Environment

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Firebase config in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com  
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### Step 5: Set Security Rules

1. In Firestore console, go to "Rules" tab
2. Replace the default rules with the content from `firestore.rules`
3. Click "Publish"

### Step 6: Seed Database

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Seed the database with sample data:
   ```bash
   npm run seed
   ```

## 🔧 Troubleshooting

### Permission Denied Error

If you see `Missing or insufficient permissions`, check:

1. **Environment Variables**: Make sure `.env.local` has correct Firebase config
2. **Security Rules**: Ensure Firestore rules allow read/write access
3. **Project ID**: Verify the project ID matches your Firebase project

### Common Issues

1. **Rules not updated**: Wait a few minutes after publishing rules
2. **Environment not loaded**: Restart the development server after changing `.env.local`
3. **Wrong project**: Double-check project ID in Firebase console

## 🔒 Security Considerations

The default rules allow open read/write access for development. For production:

1. Enable Authentication
2. Update security rules to require auth
3. Implement user roles and permissions
4. Enable audit logging

## 📊 Firestore Structure

The app creates these collections:

- `videos` - Video metadata and engagement tracking
- `channels` - Channel information and notification settings  
- `settings` - Bot configuration (document ID: 'bot-config')
- `stats` - Cached statistics for performance

## 🎯 Next Steps

After setup:

1. Visit the app at `http://localhost:3001`
2. Test video and channel management
3. Check Firestore console to see data
4. Customize security rules for production use

## 🆘 Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [GitHub Issues](https://github.com/your-repo/issues)