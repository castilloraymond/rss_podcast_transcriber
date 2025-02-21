'use client';

import { useState } from 'react';
import { parseFeed, type Feed } from '@/lib/utils/feedParser';

interface SidebarProps {
  onFeedLoaded: (feed: Feed) => void;
}

interface SavedFeed {
  id: string;
  name: string;
  url: string;
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default function Sidebar({ onFeedLoaded }: SidebarProps) {
  const [feedUrl, setFeedUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeds, setFeeds] = useState<SavedFeed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

  const loadFeed = async (url: string) => {
    if (!isValidUrl(url)) {
      throw new Error('Please enter a valid URL');
    }

    setLoading(true);
    setError(null);
    
    try {
      const feed = await parseFeed(url);
      if (!feed.items || feed.items.length === 0) {
        throw new Error('No episodes found in this feed');
      }
      onFeedLoaded(feed);
      return feed.title;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load feed';
      setError(`Error: ${errorMessage}. Please check the URL and try again.`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleFeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const feedTitle = await loadFeed(feedUrl);
      const newFeed = { 
        id: Date.now().toString(), 
        name: feedTitle, 
        url: feedUrl 
      };
      setFeeds(prev => [...prev, newFeed]);
      setSelectedFeedId(newFeed.id);
      setFeedUrl('');
    } catch (err) {
      console.error('Error adding feed:', err);
    }
  };

  const handleFeedClick = async (feed: SavedFeed) => {
    try {
      await loadFeed(feed.url);
      setSelectedFeedId(feed.id);
    } catch (err) {
      console.error('Error loading feed:', err);
    }
  };

  return (
    <div className="w-64 bg-gray-800 p-4 flex flex-col h-full">
      <form onSubmit={handleFeedSubmit} className="space-y-2 mb-4">
        <input
          type="url"
          value={feedUrl}
          onChange={(e) => {
            setFeedUrl(e.target.value);
            setError(null);
          }}
          className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Enter podcast RSS feed URL"
          required
        />
        <button
          type="submit"
          disabled={loading || !feedUrl.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Loading...' : 'Add Feed'}
        </button>
      </form>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-1">
        {feeds.map((feed) => (
          <button
            key={feed.id}
            onClick={() => handleFeedClick(feed)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
              selectedFeedId === feed.id
                ? 'bg-blue-900 hover:bg-blue-800'
                : 'hover:bg-gray-700'
            }`}
          >
            {feed.name}
          </button>
        ))}
      </div>
    </div>
  );
} 