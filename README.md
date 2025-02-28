# Ansh & Riley Full-Stack Template

This is a full-stack template project for Software Composers to create  applications with AI.

## Getting started
To create a new project, you go to `/paths`, choose from our list of Paths, and then use Cursor's Composer feature to quickly scaffold your project!

You can also edit the Path's prompt template to be whatever you like!

## Technologies used
This doesn't really matter, but is useful for the AI to understand more about this project. We are using the following technologies
- React with Next.js 14 App Router
- TailwindCSS
- Firebase Auth, Storage, and Database
- Multiple AI endpoints including OpenAI, Anthropic, and Replicate using Vercel's AI SDK

# RSS Podcast Transcriber

A web application for subscribing to podcast RSS feeds, playing episodes, generating transcripts, and getting AI-powered insights.

## Features

- Subscribe to podcast RSS feeds
- Play podcast episodes
- Generate transcripts for episodes
- Get AI-powered insights from podcast content

## Demo Chat Feature

The application includes an AI chat feature that can provide insights about podcast episodes. For demonstration purposes, the chat feature works without requiring any API keys.

### Using the Demo Chat

1. Click on the chat button in the lower right corner of the screen
2. Ask questions about the podcast you're listening to
3. The demo AI will provide insights based on your questions

Example questions you can ask:
- "What are the main points of this podcast?"
- "Can you summarize this episode?"
- "What lessons can I learn from this podcast?"
- "What challenges were discussed?"
- "What future trends were mentioned?"

### How the Demo Works

The demo chat feature uses a simulated AI response system that:
- Recognizes the podcast you're currently viewing
- Provides contextually relevant responses based on your questions
- Simulates a streaming response like a real AI would provide

No API keys or external services are required for this demo functionality.

## Using Real AI Services (Optional)

If you want to use real AI services instead of the demo:

1. Create a `.env` file in the project root
2. Add your API keys:

```
# OpenAI API Key (Free tier available)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (Requires paid credits)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

3. Update the `ChatModal.tsx` file to use your preferred API endpoint:
   - For OpenAI: `const [apiEndpoint, setApiEndpoint] = useState<string>('/api/openai/chat');`
   - For Anthropic: `const [apiEndpoint, setApiEndpoint] = useState<string>('/api/anthropic/chat');`

## Development

To run the application locally:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.