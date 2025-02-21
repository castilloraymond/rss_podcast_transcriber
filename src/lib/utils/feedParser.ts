import Parser from 'rss-parser';

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  content: string;
  date: string;
  link: string;
  audioUrl?: string;
  transcript?: string;
}

export interface Feed {
  title: string;
  description: string;
  items: FeedItem[];
}

interface CustomItem {
  content: string;
  description: string;
  guid: string;
  link: string;
  pubDate: string;
  title: string;
  enclosure?: {
    url: string;
    type: string;
  };
}

interface CustomFeed {
  title: string;
  description: string;
  items: CustomItem[];
}

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'content'],
      ['description', 'description'],
      ['enclosure', 'enclosure'],
    ],
  },
});

export async function parseFeed(url: string): Promise<Feed> {
  try {
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse feed');
    }

    const data = await response.json();
    
    // For each item, fetch its transcript if an audio URL exists
    const itemsWithTranscripts = await Promise.all(
      data.items.map(async (item: FeedItem) => {
        if (item.audioUrl) {
          try {
            const transcriptResponse = await fetch('/api/transcribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ audioUrl: item.audioUrl }),
            });
            
            if (transcriptResponse.ok) {
              const { transcript } = await transcriptResponse.json();
              return { ...item, transcript };
            }
          } catch (error) {
            console.error('Failed to fetch transcript:', error);
          }
        }
        return item;
      })
    );

    return {
      ...data,
      items: itemsWithTranscripts,
    };
  } catch (error) {
    console.error('Error parsing feed:', error);
    throw error;
  }
} 