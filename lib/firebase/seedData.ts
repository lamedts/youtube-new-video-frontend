import { VideoService, ChannelService, SettingsService } from './firestore'
import { Video, Channel, BotSettings } from '@/types'

// Sample data for seeding Firestore
const sampleVideos: Omit<Video, 'video_id'>[] = [
  {
    title: 'AI Revolution in 2024',
    channel_id: 'tc1',
    channel_title: 'TechCrunch',
    link: 'https://www.youtube.com/watch?v=abc123',
    youtube_url: 'https://www.youtube.com/watch?v=abc123',
    thumbnail: 'https://via.placeholder.com/120x90',
    discovered_at: '2024-08-15T10:30:00Z',
    published_at: '2024-08-15T08:00:00Z',
    description: 'Exploring the latest developments in AI technology...',
    click_count: 23,
    is_viewed: false,
    is_favorite: false
  },
  {
    title: 'iPhone 16 First Look',
    channel_id: 'mb1',
    channel_title: 'Marques Brownlee',
    link: 'https://www.youtube.com/watch?v=def456',
    youtube_url: 'https://www.youtube.com/watch?v=def456',
    thumbnail: 'https://via.placeholder.com/120x90',
    discovered_at: '2024-08-14T15:20:00Z',
    published_at: '2024-08-14T12:00:00Z',
    description: 'First impressions of the new iPhone 16...',
    click_count: 87,
    is_viewed: true,
    is_favorite: true
  },
  {
    title: 'Why Gravity is NOT a Force',
    channel_id: 'v1',
    channel_title: 'Veritasium',
    link: 'https://www.youtube.com/watch?v=ghi789',
    youtube_url: 'https://www.youtube.com/watch?v=ghi789',
    thumbnail: 'https://via.placeholder.com/120x90',
    discovered_at: '2024-08-13T09:15:00Z',
    published_at: '2024-08-13T06:30:00Z',
    description: 'Understanding the true nature of gravity...',
    click_count: 156,
    is_viewed: false,
    is_favorite: false
  },
  {
    title: 'Building a $50,000 Gaming PC',
    channel_id: 'ltt1',
    channel_title: 'Linus Tech Tips',
    link: 'https://www.youtube.com/watch?v=jkl012',
    youtube_url: 'https://www.youtube.com/watch?v=jkl012',
    thumbnail: 'https://via.placeholder.com/120x90',
    discovered_at: '2024-08-13T14:45:00Z',
    published_at: '2024-08-12T16:00:00Z',
    description: 'The ultimate gaming setup build...',
    click_count: 45,
    is_viewed: true,
    is_favorite: true
  }
]

const sampleChannels: Omit<Channel, 'channel_id'>[] = [
  {
    title: 'Khan Academy',
    thumbnail: 'https://via.placeholder.com/48x48',
    subscriber_count: '7.9M',
    last_video_id: 'calc101',
    last_video_title: 'Calculus Fundamentals',
    last_video_date: '2024-08-11',
    notify: false,
    subscribed_at: '2024-01-15T10:00:00Z',
    last_updated: '2024-08-11T14:30:00Z',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=ka1'
  },
  {
    title: 'Linus Tech Tips',
    thumbnail: 'https://via.placeholder.com/48x48',
    subscriber_count: '15.8M',
    last_video_id: 'gaming-pc-2024',
    last_video_title: 'Building a $50,000 Gaming PC',
    last_video_date: '2024-08-12',
    notify: true,
    subscribed_at: '2024-02-01T12:00:00Z',
    last_updated: '2024-08-12T16:00:00Z',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=ltt1'
  },
  {
    title: 'Marques Brownlee',
    thumbnail: 'https://via.placeholder.com/48x48',
    subscriber_count: '18.2M',
    last_video_id: 'iphone16-first-look',
    last_video_title: 'iPhone 16 First Look',
    last_video_date: '2024-08-14',
    notify: false,
    subscribed_at: '2024-01-20T08:30:00Z',
    last_updated: '2024-08-14T12:00:00Z',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=mb1'
  },
  {
    title: 'TechCrunch',
    thumbnail: 'https://via.placeholder.com/48x48',
    subscriber_count: '2.5M',
    last_video_id: 'ai-revolution-2024',
    last_video_title: 'AI Revolution in 2024',
    last_video_date: '2024-08-15',
    notify: true,
    subscribed_at: '2024-03-10T15:45:00Z',
    last_updated: '2024-08-15T08:00:00Z',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=tc1'
  },
  {
    title: 'Veritasium',
    thumbnail: 'https://via.placeholder.com/48x48',
    subscriber_count: '14.1M',
    last_video_id: 'gravity-not-force',
    last_video_title: 'Why Gravity is NOT a Force',
    last_video_date: '2024-08-13',
    notify: true,
    subscribed_at: '2024-01-05T09:00:00Z',
    last_updated: '2024-08-13T06:30:00Z',
    rss_url: 'https://www.youtube.com/feeds/videos.xml?channel_id=v1'
  }
]

const defaultSettings: BotSettings = {
  telegram: {
    botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghi',
    chatId: '-1001234567890'
  },
  youtube: {
    clientSecretFile: 'client_secret.json',
    tokenFile: 'token.json'
  },
  firebase: {
    credentialsFile: 'firebase-credentials.json',
    projectId: 'youtube-bot-project'
  },
  polling: {
    videoCheckIntervalSeconds: 300,
    subscriptionSyncIntervalMinutes: 60
  },
  notifications: {
    initMode: false,
    globalNotificationsEnabled: true
  }
}

export async function seedFirestoreData() {
  try {
    console.log('Seeding Firestore with sample data...')

    // Seed videos
    for (const video of sampleVideos) {
      try {
        await VideoService.createVideo(video)
        console.log(`Created video: ${video.title}`)
      } catch (error) {
        console.log(`Video already exists: ${video.title}`)
      }
    }

    // Seed channels
    for (const channel of sampleChannels) {
      try {
        await ChannelService.createChannel(channel)
        console.log(`Created channel: ${channel.title}`)
      } catch (error) {
        console.log(`Channel already exists: ${channel.title}`)
      }
    }

    // Seed settings
    try {
      await SettingsService.updateSettings(defaultSettings)
      console.log('Updated default settings')
    } catch (error) {
      console.log('Settings already exist')
    }

    console.log('Firestore seeding completed!')
  } catch (error) {
    console.error('Error seeding Firestore:', error)
  }
}