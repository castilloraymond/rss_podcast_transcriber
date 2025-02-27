import { NextResponse } from 'next/server';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is required');
}

export async function POST(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  try {
    console.log('Received transcription request');
    const { audioUrl } = await request.json();
    console.log('Original Audio URL:', audioUrl);

    if (!audioUrl) {
      console.error('No audio URL provided');
      return NextResponse.json(
        { error: 'No audio URL provided' },
        { status: 400, headers }
      );
    }

    // Validate the audio URL
    try {
      new URL(audioUrl);
    } catch (error) {
      console.error('Invalid audio URL format:', audioUrl);
      return NextResponse.json(
        { error: 'Invalid audio URL format' },
        { status: 400, headers }
      );
    }

    try {
      console.log('Making Deepgram API request...');

      // Make the transcription request using fetch directly
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&utterances=true&word_timestamps=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: audioUrl
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deepgram API error response:', errorText);
        throw new Error(`Deepgram API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Received response from Deepgram');

      if (!data.results || !data.results.channels || !data.results.channels[0]?.alternatives) {
        console.error('Invalid response format from Deepgram:', data);
        throw new Error('Invalid transcription response format');
      }

      const transcript = data.results.channels[0].alternatives[0].transcript;
      const words = data.results.channels[0].alternatives[0].words || [];

      if (!transcript) {
        throw new Error('No transcript found in response');
      }

      console.log('Transcription completed successfully');
      console.log('Transcript length:', transcript.length);
      console.log('Number of words:', words.length);

      return NextResponse.json({ 
        transcript,
        words: words.map((word: DeepgramWord) => ({
          word: word.word,
          start: word.start,
          end: word.end,
          confidence: word.confidence
        }))
      }, { headers });

    } catch (error) {
      console.error('Error during transcription:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Return a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
      return NextResponse.json(
        { error: `Transcription failed: ${errorMessage}` },
        { status: 500, headers }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers }
    );
  }
} 