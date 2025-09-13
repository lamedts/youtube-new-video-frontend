import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ channelId: string }> }
) {
  try {
    const params = await context.params
    const { channelId } = params
    const { searchParams } = new URL(request.url)
    const fallbackUrl = searchParams.get('fallback')
    
    // Use the fallback URL from the query params
    const thumbnailUrl = fallbackUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`
    
    const response = await fetch(thumbnailUrl)
    
    if (!response.ok) {
      throw new Error('Failed to fetch thumbnail')
    }
    
    const imageBuffer = await response.arrayBuffer()
    
    // Return with cache headers for Vercel CDN
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600', // 24h cache, 1h stale
        'CDN-Cache-Control': 'public, s-maxage=604800', // 7 days on CDN
        'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000', // 1 year on Vercel CDN
      },
    })
  } catch (error) {
    console.error('Error fetching thumbnail:', error)
    
    // Return 1x1 transparent pixel as fallback
    const transparentPixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    
    return new NextResponse(transparentPixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, s-maxage=3600', // Cache fallback for 1 hour
      },
    })
  }
}