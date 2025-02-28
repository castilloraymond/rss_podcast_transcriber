import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { type Word } from '@/lib/utils/feedParser';

interface TranscriptPage {
  words: Word[];
  startTime: number;
  endTime: number;
  pageNumber: number;
}

interface Note {
  id: string;
  text: string;
  customNote?: string;
  startTime: number;
  endTime: number;
  pageNumber: number;
  startWordIndex: number;
  endWordIndex: number;
}

interface SelectionPopupProps {
  position: { x: number, y: number } | null;
  onSave: () => void;
  onCancel: () => void;
}

interface TranscriptViewerProps {
  transcript: string;
  words: Word[];
  audioElement: HTMLAudioElement | null;
  wordsPerPage?: number;
}

// Selection popup component
const SelectionPopup = ({ position, onSave, onCancel }: SelectionPopupProps) => {
  if (!position) return null;
  
  return (
    <div 
      className="fixed z-10 bg-gray-700 rounded-md shadow-lg p-2 flex gap-2"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      <button 
        onClick={onSave}
        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Save as Note
      </button>
      <button 
        onClick={onCancel}
        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default function TranscriptViewer({ 
  transcript, 
  words,
  audioElement, 
  wordsPerPage = 150
}: TranscriptViewerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [pages, setPages] = useState<TranscriptPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [jumpToPage, setJumpToPage] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  
  // Selection state
  const [selection, setSelection] = useState<{
    text: string;
    startWordIndex: number;
    endWordIndex: number;
  } | null>(null);
  
  // Popup state
  const [popupPosition, setPopupPosition] = useState<{ x: number, y: number } | null>(null);
  
  // Custom note input state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [customNoteText, setCustomNoteText] = useState('');
  
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

  // Handle mouse up event for text selection
  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        
        if (!selection || selection.isCollapsed || !transcriptRef.current) {
          return;
        }
        
        const selectedText = selection.toString().trim();
        if (!selectedText) return;
        
        // Check if selection is within our transcript container
        const range = selection.getRangeAt(0);
        const container = transcriptRef.current;
        
        if (!container.contains(range.commonAncestorContainer)) {
          return;
        }
        
        // Find the word elements that contain the selection
        const allWordElements = Array.from(container.querySelectorAll('[data-word-index]'));
        
        // Get all word elements that are part of the selection
        const selectedElements = allWordElements.filter(element => {
          return range.intersectsNode(element);
        });
        
        if (selectedElements.length === 0) return;
        
        // Find start and end indices
        const indices = selectedElements.map(el => 
          parseInt(el.getAttribute('data-word-index') || '-1')
        ).filter(idx => idx !== -1);
        
        if (indices.length === 0) return;
        
        const startWordIndex = Math.min(...indices);
        const endWordIndex = Math.max(...indices);
        
        // Format the selected text with proper spacing
        const formattedText = selectedElements
          .map(el => el.textContent)
          .filter(Boolean)
          .join(' ');
        
        setSelection({
          text: formattedText,
          startWordIndex,
          endWordIndex
        });
        
        // Position the popup near the end of the selection
        const rect = range.getBoundingClientRect();
        
        setPopupPosition({
          x: rect.left + (rect.width / 2),
          y: rect.top - 10
        });
      }, 10); // Small delay to ensure selection is complete
    };
    
    // Add mouseup event to detect when selection is complete
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [currentPage, pages]);

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

  const saveSelection = () => {
    if (!selection) return;
    
    const { startWordIndex, endWordIndex, text } = selection;
    const currentPageWords = pages[currentPage]?.words || [];
    
    if (startWordIndex >= 0 && endWordIndex < currentPageWords.length) {
      const selectedWords = currentPageWords.slice(startWordIndex, endWordIndex + 1);
      
      const newNote: Note = {
        id: Date.now().toString(),
        text: text,
        startTime: selectedWords[0].start,
        endTime: selectedWords[selectedWords.length - 1].end,
        pageNumber: pages[currentPage].pageNumber,
        startWordIndex,
        endWordIndex
      };
      
      setNotes(prev => [...prev, newNote]);
      
      // Clear selection and popup
      window.getSelection()?.removeAllRanges();
      setSelection(null);
      setPopupPosition(null);
    }
  };

  const cancelSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setPopupPosition(null);
  };

  const handlePlayNote = (startTime: number) => {
    if (audioElement) {
      audioElement.currentTime = startTime;
      audioElement.play();
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
      setCustomNoteText('');
    }
  };
  
  const startEditingNote = (noteId: string, existingNote?: string) => {
    setEditingNoteId(noteId);
    setCustomNoteText(existingNote || '');
  };
  
  const saveCustomNote = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, customNote: customNoteText.trim() || undefined } 
        : note
    ));
    setEditingNoteId(null);
    setCustomNoteText('');
  };

  const exportNotes = () => {
    if (notes.length === 0) return;
    
    const notesText = notes.map(note => {
      let text = `Note (Page ${note.pageNumber}, Time: ${formatTime(note.startTime)}): ${note.text}`;
      if (note.customNote) {
        text += `\nComment: ${note.customNote}`;
      }
      return text;
    }).join('\n\n');
    
    const blob = new Blob([notesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript-notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 relative">
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

      {/* Selection Instructions */}
      <div className="text-xs text-gray-400 italic">
        Select any text in the transcript to save it as a note. You can add your own comments to each note.
      </div>

      {/* Transcript Display */}
      <div 
        ref={transcriptRef}
        className="bg-gray-800 rounded-lg p-6 leading-relaxed max-h-[60vh] overflow-y-auto relative"
      >
        {pages[currentPage]?.words.map((word, index) => {
          const isCurrentWord = currentTime >= word.start && currentTime <= word.end;
          
          return (
            <motion.span
              key={`${word.word}-${index}`}
              data-word-index={index}
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
      
      {/* Selection Popup - Moved outside the transcript container to avoid z-index issues */}
      {popupPosition && (
        <SelectionPopup 
          position={popupPosition}
          onSave={saveSelection}
          onCancel={cancelSelection}
        />
      )}

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Saved Notes</h3>
            <button
              onClick={exportNotes}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Export Notes
            </button>
          </div>
          
          <div className="space-y-4">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handlePlayNote(note.startTime)}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                      title="Play this section"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Delete note"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className="text-white font-medium break-words">{note.text}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Page {note.pageNumber} • Time: {formatTime(note.startTime)}
                    </div>
                    
                    {/* Custom Note Section */}
                    {editingNoteId === note.id ? (
                      <div className="mt-3">
                        <textarea
                          value={customNoteText}
                          onChange={(e) => setCustomNoteText(e.target.value)}
                          placeholder="Add your notes here..."
                          className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveCustomNote(note.id)}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        {note.customNote ? (
                          <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 border-l-2 border-blue-500 break-words">
                            <div className="text-xs text-gray-400 mb-1">Your notes:</div>
                            {note.customNote}
                          </div>
                        ) : null}
                        <button
                          onClick={() => startEditingNote(note.id, note.customNote)}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          {note.customNote ? 'Edit notes' : 'Add notes'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 