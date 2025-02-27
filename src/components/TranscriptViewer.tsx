import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { type Word } from '@/lib/utils/feedParser';

interface TranscriptPage {
  words: Word[];
  startTime: number;
  endTime: number;
  pageNumber: number;
}

interface TranscriptViewerProps {
  transcript: string;
  words: Word[];
  audioElement: HTMLAudioElement | null;
  wordsPerPage?: number;
}

export default function TranscriptViewer({ 
  transcript, 
  words,
  audioElement, 
  wordsPerPage = 150 // Increased from 50 to show more content per page
}: TranscriptViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [pages, setPages] = useState<TranscriptPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioElement]);

  useEffect(() => {
    // Group words into pages
    const newPages: TranscriptPage[] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      if (pageWords.length > 0) {
        newPages.push({
          words: pageWords,
          startTime: pageWords[0].start,
          endTime: pageWords[pageWords.length - 1].end,
          pageNumber: Math.floor(i / wordsPerPage) + 1
        });
      }
    }

    setPages(newPages);
  }, [words, wordsPerPage]);

  useEffect(() => {
    // Update current page based on current time
    const newPageIndex = pages.findIndex(
      page => currentTime >= page.startTime && currentTime <= page.endTime
    );
    if (newPageIndex !== -1 && newPageIndex !== currentPage) {
      setCurrentPage(newPageIndex);
    }
  }, [currentTime, pages, currentPage]);

  const handleWordClick = (startTime: number) => {
    if (audioElement) {
      audioElement.currentTime = startTime;
      audioElement.play();
    }
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= pages.length) {
      setCurrentPage(pageNum - 1);
      // If audio is available, jump to the start time of the page
      if (audioElement && pages[pageNum - 1]) {
        audioElement.currentTime = pages[pageNum - 1].startTime;
      }
    }
    setJumpToPage('');
  };

  const handleJumpInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">
            Page {currentPage + 1} of {pages.length}
          </span>
          
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={handleJumpInputKeyDown}
              placeholder="Go to page"
              className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleJumpToPage}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Go
            </button>
          </div>
        </div>
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(pages.length - 1, prev + 1))}
          disabled={currentPage === pages.length - 1}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Transcript Display */}
      <div 
        ref={transcriptRef}
        className="bg-gray-800 rounded-lg p-6 leading-relaxed max-h-[60vh] overflow-y-auto"
      >
        {pages[currentPage]?.words.map((word, index) => {
          const isCurrentWord = currentTime >= word.start && currentTime <= word.end;
          return (
            <motion.span
              key={`${word.word}-${index}`}
              initial={{ opacity: 0.8 }}
              animate={{ 
                opacity: isCurrentWord ? 1 : 0.8,
                scale: isCurrentWord ? 1.1 : 1,
              }}
              className={`inline-block cursor-pointer mx-0.5 rounded px-1 ${
                isCurrentWord
                  ? 'bg-blue-600 text-white font-bold text-lg'
                  : 'hover:text-blue-300 text-base'
              }`}
              onClick={() => handleWordClick(word.start)}
            >
              {word.word}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
} 