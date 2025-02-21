'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar'
import PodcastList from '@/components/PodcastList'
import type { Feed, FeedItem } from '@/lib/utils/feedParser';

export default function Home() {
  const [episodes, setEpisodes] = useState<FeedItem[]>([]);

  const handleFeedLoaded = (feed: Feed) => {
    setEpisodes(feed.items);
  };

  const handleTranscriptGenerated = (episodeId: string, transcript: string) => {
    setEpisodes(prevEpisodes => 
      prevEpisodes.map(episode => 
        episode.id === episodeId 
          ? { ...episode, transcript } 
          : episode
      )
    );
  };

  return (
    <main className="flex h-screen">
      <Sidebar onFeedLoaded={handleFeedLoaded} />
      <PodcastList 
        episodes={episodes} 
        onTranscriptGenerated={handleTranscriptGenerated}
      />
    </main>
  )
}
