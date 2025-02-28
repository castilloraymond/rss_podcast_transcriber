'use client';

import React, { useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TranscriptViewerProps {
  transcript: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

interface Note {
  id: string;
  text: string;
  timestamp: number;
  pageNumber: number;
}

export default function TranscriptViewer({ transcript, currentTime, onTimeUpdate }: TranscriptViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(103); // Hardcoded for now, should be calculated
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const textRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
    }
  };

  const saveNote = () => {
    if (selectedText) {
      const newNote: Note = {
        id: Date.now().toString(),
        text: selectedText,
        timestamp: currentTime,
        pageNumber: currentPage,
      };
      setNotes([...notes, newNote]);
      setSelectedText('');
    }
  };

  const exportNotes = () => {
    const noteText = notes
      .map((note) => `Page ${note.pageNumber} - ${note.text}\n`)
      .join('\n');
    const blob = new Blob([noteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript-notes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Transcript Content */}
        <div
          ref={textRef}
          className="h-full p-8 overflow-y-auto"
          onMouseUp={handleTextSelection}
        >
          {transcript}
        </div>
        
        {/* Page Navigation */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 rounded hover:bg-gray-100"
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <span>Page {currentPage} of {totalPages}</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="w-16 px-2 py-1 border rounded"
            />
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 rounded hover:bg-gray-100"
            disabled={currentPage === totalPages}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <button
            onClick={exportNotes}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Export Notes
          </button>
        </div>
        
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start space-x-4 p-2 border rounded">
              <button
                onClick={() => onTimeUpdate(note.timestamp)}
                className="p-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                ▶️
              </button>
              <div>
                <div className="text-sm text-gray-500">Page {note.pageNumber}</div>
                <div>{note.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 