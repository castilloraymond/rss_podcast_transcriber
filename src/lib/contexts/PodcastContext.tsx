'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { FeedItem, Word } from '@/lib/utils/feedParser';

interface PodcastContextType {
  currentEpisode: FeedItem | null;
  setCurrentEpisode: (episode: FeedItem | null) => void;
  transcript: string;
  setTranscript: (transcript: string) => void;
  words: Word[];
  setWords: (words: Word[]) => void;
}

const PodcastContext = createContext<PodcastContextType | undefined>(undefined);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<FeedItem | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [words, setWords] = useState<Word[]>([]);

  return (
    <PodcastContext.Provider 
      value={{ 
        currentEpisode, 
        setCurrentEpisode, 
        transcript, 
        setTranscript, 
        words, 
        setWords 
      }}
    >
      {children}
    </PodcastContext.Provider>
  );
}

export function usePodcast() {
  const context = useContext(PodcastContext);
  if (context === undefined) {
    throw new Error('usePodcast must be used within a PodcastProvider');
  }
  return context;
} 