import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['description', 'description'],
      ['enclosure', 'enclosure'],
      ['media:content', 'mediaContent'],
    ],
  },
});

async function fetchWithTimeout(url: string, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('xml') && !contentType?.includes('rss')) {
      console.warn('Response is not RSS/XML:', contentType);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching feed:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('Received feed request');
    const { url } = await request.json();

    if (!url) {
      console.error('No feed URL provided');
      return NextResponse.json(
        { error: 'Feed URL is required' },
        { status: 400 }
      );
    }

    console.log('Fetching feed from URL:', url);
    // Use a proxy for CORS if needed
    const feedUrl = url.startsWith('http') ? url : `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    // Fetch the feed content first
    const feedContent = await fetchWithTimeout(feedUrl);
    if (!feedContent || feedContent.trim().startsWith('<!DOCTYPE')) {
      throw new Error('Invalid feed format - received HTML instead of RSS');
    }
    
    // Parse the feed content
    const feed = await parser.parseString(feedContent);
    console.log('Feed parsed successfully:', feed.title);
    
    return NextResponse.json({
      title: feed.title || 'Untitled Feed',
      description: feed.description || '',
      items: (feed.items || []).slice(0, 25).map((item: any, index) => {
        console.log(`Processing item ${index + 1}:`, item.title);
        
        // Get audio URL from enclosure or media:content
        let audioUrl = undefined;
        
        // Check enclosure
        if (item.enclosure?.url) {
          console.log('Found enclosure:', item.enclosure);
          if (item.enclosure.type?.startsWith('audio/')) {
            audioUrl = item.enclosure.url;
            console.log('Using audio URL from enclosure:', audioUrl);
          }
        }
        
        // Check media:content as fallback
        if (!audioUrl && item.mediaContent) {
          console.log('Found media:content:', item.mediaContent);
          if (item.mediaContent.type?.startsWith('audio/')) {
            audioUrl = item.mediaContent.url;
            console.log('Using audio URL from media:content:', audioUrl);
          }
        }

        // Additional check for iframes or embedded players in content
        if (!audioUrl && item.content) {
          const match = item.content.match(/src="(https:\/\/[^"]*\.mp3)"/);
          if (match) {
            audioUrl = match[1];
            console.log('Found audio URL in content:', audioUrl);
          }
        }

        const episodeData = {
          id: item.guid || item.link || `item-${index}`,
          title: item.title || 'Untitled Item',
          description: item.description || '',
          content: item.content || item.description || '',
          date: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '',
          link: item.link || '',
          audioUrl,
        };

        console.log('Processed episode data:', {
          id: episodeData.id,
          title: episodeData.title,
          hasAudio: !!episodeData.audioUrl
        });

        return episodeData;
      }),
    });
  } catch (error) {
    console.error('Error parsing feed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse feed' },
      { status: 500 }
    );
  }
} 