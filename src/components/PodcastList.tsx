'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { type FeedItem } from '@/lib/utils/feedParser';

interface PodcastListProps {
  episodes: FeedItem[];
  onTranscriptGenerated: (episodeId: string, transcript: string) => void;
}

export default function PodcastList({ episodes, onTranscriptGenerated }: PodcastListProps) {
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'transcript'>('description');
  const [isGeneratingTranscript, setIsGeneratingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);

  const selectedEpisodeData = episodes.find(ep => ep.id === selectedEpisode);

  const handleGenerateTranscript = async () => {
    if (!selectedEpisodeData?.audioUrl) {
      console.error('No audio URL available for transcript generation');
      setTranscriptError('No audio URL available');
      return;
    }
    
    console.log('Starting transcript generation for:', selectedEpisodeData.audioUrl);
    setIsGeneratingTranscript(true);
    setTranscriptError(null);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl: selectedEpisodeData.audioUrl }),
      });
      
      console.log('Transcript API response status:', response.status);
      const data = await response.json();
      console.log('Transcript API response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate transcript');
      }
      
      if (data.transcript) {
        console.log('Transcript generated successfully');
        onTranscriptGenerated(selectedEpisodeData.id, data.transcript);
        setActiveTab('transcript');
      } else {
        throw new Error('No transcript in response');
      }
    } catch (error) {
      console.error('Error generating transcript:', error);
      setTranscriptError(error instanceof Error ? error.message : 'Failed to generate transcript');
    } finally {
      setIsGeneratingTranscript(false);
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
              <button
                key={episode.id}
                className={`w-full text-left px-3 py-2 rounded-lg ${
                  selectedEpisode === episode.id 
                    ? 'bg-blue-900 hover:bg-blue-800' 
                    : 'hover:bg-gray-700'
                } cursor-pointer transition-colors text-sm`}
                onClick={() => setSelectedEpisode(episode.id)}
              >
                {episode.title}
              </button>
            ))}
          </div>
          {episodes.length === 0 && (
            <p className="text-gray-500 text-sm text-center">
              No episodes available
            </p>
          )}
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
                {selectedEpisodeData.audioUrl && !selectedEpisodeData.transcript && !isGeneratingTranscript && (
                  <button
                    onClick={handleGenerateTranscript}
                    className="ml-auto px-4 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    Generate Transcript
                  </button>
                )}
                {isGeneratingTranscript && (
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    Generating transcript...
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6">
              <div className="prose prose-invert max-w-none">
                {activeTab === 'transcript' ? (
                  selectedEpisodeData.transcript ? (
                    <ReactMarkdown>
                      {selectedEpisodeData.transcript}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-gray-400">
                      {isGeneratingTranscript 
                        ? 'Generating transcript...'
                        : transcriptError || 'No transcript available. Click "Generate Transcript" to create one.'}
                    </div>
                  )
                ) : (
                  <ReactMarkdown>
                    {selectedEpisodeData.content || selectedEpisodeData.description || ''}
                  </ReactMarkdown>
                )}
              </div>
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