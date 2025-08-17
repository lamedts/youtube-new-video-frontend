# YouTube Bot Manager - Frontend

A modern React/Next.js frontend for managing a YouTube Video Bot with advanced video tracking, channel management, and real-time notifications.

## 🎯 Features

### Core Functionality
- **Two-Tab Interface**: Videos and Channels management
- **Click Tracking**: Automatic view counting and engagement analytics
- **Floating Video Player**: CS chat-style widget with YouTube integration
- **Header Statistics**: Live stats display (enabled channels, videos this week, total videos)
- **Visual States**: Viewed/unviewed indication with grey-out effect
- **Favorites System**: Star-based video bookmarking
- **Smart Thumbnails**: Automatic fallback system for missing images

### Video Management
- Search functionality for video titles and channels
- Date range filtering
- Favorites and unviewed filters
- Click-to-play video interaction
- Video deletion capabilities
- Real-time engagement tracking

### Channel Management
- Channel search and filtering
- Notification toggle per channel
- Bulk notification management
- Smart thumbnail fallback with colorful placeholders
- Subscriber count display
- Last video information

### Technical Features
- **Framework**: Next.js 14+ with App Router
- **State Management**: Redux Toolkit + RTK Query
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (optional)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Responsive Design**: Mobile-first approach

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with ES6+ support

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - (Optional) Enable Authentication
   - Copy `.env.local.example` to `.env.local` and fill in your Firebase configuration:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Seed the database (optional)**
   ```bash
   curl -X POST http://localhost:3001/api/seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000) (or the port shown in terminal)

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📱 UI Components

### Header Bar
- YouTube Bot Manager branding
- Real-time statistics badges for active channels, weekly videos, and total videos
- Last synchronization timestamp
- Responsive design for mobile/tablet/desktop

### Videos Tab
- **Search & Filters**: Search by title/channel, date range, favorites/unviewed filters
- **Video List**: Row-based layout with thumbnails, titles, channel info, and engagement data
- **Video Interaction**: Click tracking, favorite toggling, deletion
- **Visual States**: Viewed videos automatically greyed out

### Channels Tab
- **Channel Management**: Search, filter by notification status, sorting options
- **Bulk Operations**: Select multiple channels for notification management
- **Channel Info**: Subscriber count, last video details, notification status
- **Smart Avatars**: Colorful fallback avatars with channel initials

### Floating Video Player
- **CS Chat Style**: Bottom-right floating widget
- **Two States**: Expanded (384x256px) and minimized (320x64px)
- **YouTube Integration**: Direct links to actual YouTube videos
- **Video Preview**: Thumbnail with play overlay
- **Controls**: Minimize, maximize, close buttons

## 🔧 Technical Architecture

### State Management
```typescript
// Redux Store Structure
interface RootState {
  videos: VideosState      // Video list, filters, favorites, view history
  channels: ChannelsState  // Channel list, notifications, bulk operations
  player: PlayerState     // Floating player state and settings
  settings: SettingsState // Bot configuration and connection status
  ui: UIState            // Dark mode, active tab, notifications
}
```

### API Integration
- **RTK Query**: Efficient data fetching and caching
- **REST Endpoints**: Full CRUD operations for videos and channels
- **Firestore**: Real-time database with automated scaling
- **Authentication**: Firebase Auth for secure access

### Component Structure
```
components/
├── layout/           # Header, navigation, layout components
├── videos/           # Video list, row, player components
├── channels/         # Channel list, row, management components
└── ui/              # Reusable UI components
```

## 🔌 API Reference

### Videos API
```typescript
GET    /api/videos              # Get filtered videos
PUT    /api/videos/:id/click    # Increment click count
PUT    /api/videos/:id/favorite # Toggle favorite status
DELETE /api/videos/:id          # Delete video
```

### Channels API
```typescript
GET    /api/channels                    # Get filtered channels
PUT    /api/channels/:id/notify         # Toggle notifications
POST   /api/channels/bulk-notify        # Bulk notification update
```

### Stats & Settings API
```typescript
GET    /api/stats/header        # Header statistics
GET    /api/settings           # Bot configuration
PUT    /api/settings           # Update settings
POST   /api/bot/sync          # Trigger sync
POST   /api/seed              # Seed database with sample data
```

## 📱 Responsive Design

### Mobile (320px - 768px)
- Simplified header stats
- Single column video list
- Touch-optimized controls

### Tablet (768px - 1024px)  
- Condensed header display
- Optimized video row spacing

### Desktop (1024px+)
- Full header stats display
- Maximum width containers
- All features enabled

---

**YouTube Bot Manager Frontend** - A modern, responsive interface for YouTube bot management with advanced video tracking and engagement analytics.

The application is now running at http://localhost:3001 and ready for use!