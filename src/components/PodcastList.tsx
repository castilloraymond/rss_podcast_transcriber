'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { type FeedItem } from '@/lib/utils/feedParser';
import { motion } from 'framer-motion';
import HTMLReactParser from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import TranscriptViewer from './TranscriptViewer';
import { usePodcast } from '@/lib/contexts/PodcastContext';

interface PodcastListProps {
  episodes: FeedItem[];
  onTranscriptGenerated: (episodeId: string, transcript: string, words: any[]) => void;
}

export default function PodcastList({ episodes, onTranscriptGenerated }: PodcastListProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'transcript'>('description');
  const [transcribingEpisodes, setTranscribingEpisodes] = useState<Set<string>>(new Set());
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { setCurrentEpisode, setTranscript, setWords } = usePodcast();

  const selectedEpisodeData = episodes.find(ep => ep.id === selectedEpisode);

  // Update the podcast context when the selected episode changes
  const handleEpisodeSelect = (episodeId: string) => {
    setSelectedEpisode(episodeId);
    const episode = episodes.find(ep => ep.id === episodeId);
    if (episode) {
      setCurrentEpisode(episode);
      setTranscript(episode.transcript || '');
      setWords(episode.words || []);
    }
  };

  const handleGenerateTranscript = async (episodeId: string, audioUrl: string) => {
    if (!audioUrl) {
      setTranscriptError('No audio URL available');
      return;
    }
    
    setTranscriptError(null);
    setTranscribingEpisodes(prev => new Set(prev).add(episodeId));
    
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.transcript) {
        onTranscriptGenerated(episodeId, data.transcript, data.words || []);
        
        // Update the podcast context with the new transcript
        const episode = episodes.find(ep => ep.id === episodeId);
        if (episode) {
          setCurrentEpisode(episode);
          setTranscript(data.transcript);
          setWords(data.words || []);
        }
        
        setActiveTab('transcript');
      } else {
        throw new Error('No transcript returned');
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      setTranscriptError(`Failed to generate transcript: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTranscribingEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(episodeId);
        return newSet;
      });
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Middle Panel - Episode Titles */}
      <div className="w-80 border-r border-gray-700 overflow-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Episodes</h2>
          <div className="space-y-2">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className={`w-full rounded-lg ${
                  selectedEpisode === episode.id 
                    ? 'bg-blue-900' 
                    : 'bg-gray-800'
                } p-3 space-y-2`}
              >
                <button
                  className="w-full text-left text-sm hover:text-blue-300 transition-colors"
                  onClick={() => handleEpisodeSelect(episode.id)}
                >
                  {episode.title}
                </button>
                {episode.transcript && (
                  <div className="text-xs text-green-400">
                    ✓ Transcribed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Episode Content */}
      <div className="flex-1 overflow-auto">
        {selectedEpisodeData ? (
          <div className="h-full flex flex-col">
            {/* Episode Header */}
            <div className="p-6 border-b border-gray-700">
              <h1 className="text-2xl font-bold mb-2">
                {selectedEpisodeData.title}
              </h1>
              <p className="text-gray-400 text-sm mb-4">
                {selectedEpisodeData.date}
              </p>
              
              {/* Audio Player */}
              {selectedEpisodeData.audioUrl && (
                <div className="mb-4">
                  <audio 
                    ref={audioRef}
                    controls 
                    className="w-full"
                    src={selectedEpisodeData.audioUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Content Tabs */}
              <div className="flex items-center gap-4 border-b border-gray-700">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'description'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('description')}
                >
                  Description
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'transcript'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('transcript')}
                >
                  Transcript
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === 'transcript' ? (
                selectedEpisodeData.transcript ? (
                  <TranscriptViewer
                    transcript={selectedEpisodeData.transcript}
                    words={selectedEpisodeData.words || []}
                    audioElement={audioRef.current}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    {transcribingEpisodes.has(selectedEpisodeData.id) ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                        />
                        <p className="text-gray-400">Generating transcript...</p>
                      </>
                    ) : (
                      <>
                        {selectedEpisodeData.audioUrl && (
                          <button
                            onClick={() => handleGenerateTranscript(selectedEpisodeData.id, selectedEpisodeData.audioUrl!)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            Generate Transcript
                          </button>
                        )}
                        {transcriptError && (
                          <p className="text-red-400 text-sm mt-2">{transcriptError}</p>
                        )}
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="prose prose-invert max-w-none">
                  {HTMLReactParser(DOMPurify.sanitize(selectedEpisodeData.content || selectedEpisodeData.description || ''))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an episode to view its content
          </div>
        )}
      </div>
    </div>
  );
} 