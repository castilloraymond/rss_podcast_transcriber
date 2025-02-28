'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { usePodcast } from '@/lib/contexts/PodcastContext';

interface ChatModalProps {
  onClose: () => void;
}

export default function ChatModal({ onClose }: ChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentEpisode, transcript } = usePodcast();
  const [error, setError] = useState<string | null>(null);
  // Use our new demo-chat endpoint
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/demo-chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modelInfo, setModelInfo] = useState<string>("Demo Model (Free)");
  
  // Prepare podcast context for the AI
  const podcastContext = currentEpisode ? 
    `Podcast Title: ${currentEpisode.title}\n` +
    `Description: ${currentEpisode.description?.substring(0, 500) || 'No description available'}\n` +
    `Transcript: ${transcript?.substring(0, 5000) || 'No transcript available'}`
    : '';
  
  // System message for the AI
  const systemMessage = `You are an AI assistant that helps users gain insights from podcast transcripts. 
  ${podcastContext ? `Here is the context from the current podcast: ${podcastContext}` : 
  'The user has not provided any podcast transcript yet. Ask them what podcast they are listening to and what they would like to know about it.'}
  
  If the user asks for insights, summaries, key points, or lessons from the podcast, provide them based on the transcript.
  If there is no transcript available, let the user know they need to generate a transcript first.
  Be concise but informative in your responses.`;
  
  // Use the AI chat API
  const { messages, input, handleInputChange, handleSubmit, error: chatError, setMessages } = useChat({
    api: apiEndpoint,
    initialMessages: [
      {
        id: 'system-1',
        role: 'system',
        content: systemMessage,
      },
    ],
    onResponse: (response) => {
      // Update model info when we get a response
      const modelHeader = response.headers.get('x-model-used');
      if (modelHeader) {
        setModelInfo(modelHeader);
      }
    },
    onError: (error) => {
      console.error(`Chat API error (${apiEndpoint}):`, error);
      setError(error.message || "Failed to get a response from the AI. Please try again.");
    }
  });

  // Clear error when input changes
  useEffect(() => {
    if (error) setError(null);
  }, [input]);

  // Display chat error from useChat hook
  useEffect(() => {
    if (chatError) {
      console.error("Chat error from hook:", chatError);
      setError(chatError.message || "Failed to get a response from the AI. Please try again.");
    }
  }, [chatError]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Custom submit handler with error handling
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!input.trim()) return;
    
    try {
      setIsLoading(true);
      await handleSubmit(e);
    } catch (err) {
      console.error("Error submitting chat:", err);
      setError(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-xl w-full max-w-md mx-4 md:mx-0 h-[600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">
            Podcast AI Assistant
            {isLoading && (
              <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* API Status Indicator */}
        <div className="bg-gray-900 px-3 py-1 text-xs flex justify-between items-center">
          <span className="text-blue-300 font-medium">
            Model: {modelInfo} (No API key required)
          </span>
          {isLoading && (
            <span className="text-green-400">Processing...</span>
          )}
        </div>
        
        {/* Current podcast info */}
        {currentEpisode && (
          <div className="bg-gray-700 p-3 text-sm">
            <p className="font-medium">Current podcast: {currentEpisode.title}</p>
            {!transcript && (
              <p className="text-amber-400 mt-1">No transcript available. Generate a transcript to get better insights.</p>
            )}
          </div>
        )}
        
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-8">
              <p>👋 Welcome to the Podcast AI Assistant!</p>
              <p className="mt-2">Ask questions about the podcast to get insights, summaries, or key points.</p>
              <p className="mt-2 text-sm">Example questions:</p>
              <ul className="mt-1 text-sm space-y-1">
                <li>• What are the main points of this podcast?</li>
                <li>• Can you summarize this episode?</li>
                <li>• What lessons can I learn from this podcast?</li>
              </ul>
            </div>
          )}
          {messages.filter(m => m.role !== 'system').map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-gray-600 text-gray-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input form */}
        <form onSubmit={handleFormSubmit} className="border-t border-gray-700 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={isLoading ? "Waiting for response..." : "Ask about the podcast..."}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 