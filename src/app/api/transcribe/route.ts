import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

// Initialize the Deepgram client
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  console.error('DEEPGRAM_API_KEY is not configured');
}
const deepgram = createClient(DEEPGRAM_API_KEY || '');

export async function POST(request: Request) {
  try {
    console.log('Received transcription request');
    const { audioUrl } = await request.json();
    console.log('Audio URL:', audioUrl);

    if (!audioUrl) {
      console.error('No audio URL provided');
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      );
    }

    if (!DEEPGRAM_API_KEY) {
      console.error('Deepgram API key not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }

    // Use a proxy for CORS if needed
    const proxyUrl = audioUrl.startsWith('http') 
      ? audioUrl 
      : `https://api.allorigins.win/raw?url=${encodeURIComponent(audioUrl)}`;
    console.log('Using proxy URL:', proxyUrl);

    try {
      // First check if the audio URL is accessible
      console.log('Checking audio file accessibility...');
      const audioResponse = await fetch(proxyUrl);
      if (!audioResponse.ok) {
        console.error('Audio file not accessible:', audioResponse.status);
        throw new Error('Audio file not accessible');
      }
      console.log('Audio file is accessible');
    } catch (error) {
      console.error('Error accessing audio file:', error);
      return NextResponse.json(
        { error: 'Could not access audio file. Please check the URL.' },
        { status: 400 }
      );
    }

    // Transcribe the audio using Deepgram
    console.log('Starting Deepgram transcription...');
    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: proxyUrl },
      {
        smart_format: true,
        punctuate: true,
        paragraphs: true,
        utterances: true,
        diarize: true,
      }
    );

    if (error || !result) {
      console.error('Deepgram transcription error:', error);
      return NextResponse.json(
        { error: 'Failed to transcribe audio', details: error?.message },
        { status: 500 }
      );
    }

    console.log('Transcription completed successfully');
    // Extract and format the transcript
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    // Format the transcript with proper line breaks and speaker labels if available
    const formattedTranscript = transcript
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');

    return NextResponse.json({ 
      transcript: formattedTranscript,
      success: true
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: errorMessage },
      { status: 500 }
    );
  }
} 