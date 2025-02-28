'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar'
import PodcastList from '@/components/PodcastList'
import ChatButton from '@/components/ChatButton'
import type { Feed, FeedItem, Word } from '@/lib/utils/feedParser';

export default function Home() {
  const [episodes, setEpisodes] = useState<FeedItem[]>([]);

  const handleFeedLoaded = (feed: Feed) => {
    setEpisodes(feed.items);
  };

  const handleTranscriptGenerated = (episodeId: string, transcript: string, words: Word[]) => {
    setEpisodes(prevEpisodes => 
      prevEpisodes.map(episode => 
        episode.id === episodeId 
          ? { ...episode, transcript, words } 
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
      <ChatButton />
    </main>
  )
}
