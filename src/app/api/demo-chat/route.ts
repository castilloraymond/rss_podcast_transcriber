import { Message } from 'ai';

export const runtime = "edge";

// Define message type
interface ChatMessage {
  role: string;
  content: string;
  id?: string;
}

// This is a simplified implementation that doesn't require any API keys
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Log the request for debugging
    console.log("Demo chat request received with", messages.length, "messages");
    
    // Get the last user message
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === 'user').pop();
    const userQuery = lastUserMessage?.content || '';
    
    // Get the system message to extract podcast context
    const systemMessage = messages.find((m: ChatMessage) => m.role === 'system');
    const podcastContext = systemMessage?.content || '';
    
    // Extract podcast title if available
    let podcastTitle = "the podcast";
    const titleMatch = podcastContext.match(/Podcast Title: (.*?)\\n/);
    if (titleMatch && titleMatch[1]) {
      podcastTitle = titleMatch[1];
    }
    
    // Create a response based on the user's query and podcast context
    const responseText = generateResponse(userQuery, podcastTitle, podcastContext);
    
    // Create a response in the format expected by the Vercel AI SDK
    const response = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "demo-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseText,
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
    
    // Return a standard JSON response
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'x-model-used': 'Demo Model (Free)'
      }
    });
  } catch (error) {
    console.error("Error in demo chat API:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred processing your request" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// A function to generate responses for demo purposes
function generateResponse(query: string, podcastTitle: string, context: string): string {
  query = query.toLowerCase();
  const hasTranscript = context.includes('Transcript:') && !context.includes('No transcript available');
  
  // If no transcript is available
  if (!hasTranscript && (query.includes('summary') || query.includes('key point') || query.includes('highlight') || 
      query.includes('lesson') || query.includes('insight'))) {
    return `I'd love to provide insights about ${podcastTitle}, but I don't see a transcript available yet. To get the most helpful analysis, please generate a transcript first by clicking the "Generate Transcript" button when viewing the podcast.`;
  }
  
  if (query.includes('hello') || query.includes('hi ') || query.includes('hey') || query.includes('greetings')) {
    return `Hello! I'm your podcast assistant. I can help you understand key points from ${podcastTitle} or answer questions about it. What would you like to know?`;
  }
  
  if (query.includes('who are you') || query.includes('what can you do') || query.includes('how do you work')) {
    return `I'm a demo AI assistant designed to help you get insights from ${podcastTitle}. I can summarize content, highlight key points, or extract lessons from the podcast. This is a demonstration version that works without requiring any API keys.`;
  }
  
  if (query.includes('summary') || query.includes('summarize')) {
    return `Here is a summary of ${podcastTitle}. This podcast explores important concepts around technology and innovation. The speakers discuss how emerging technologies are reshaping industries and society. They emphasize the importance of ethical considerations in development and implementation. The conversation also covers challenges in adoption and how organizations can better prepare for technological change.`;
  }
  
  if (query.includes('key point') || query.includes('main point') || query.includes('highlight')) {
    return `The key points from ${podcastTitle} include. Technology adoption is accelerating across all sectors. Privacy concerns remain a major challenge for new technologies. Collaboration between technical and non-technical teams is essential for innovation. User experience should be prioritized in product development. Data-driven decision making leads to better outcomes.`;
  }
  
  if (query.includes('lesson') || query.includes('learn')) {
    return `Main lessons from ${podcastTitle}. Always consider the ethical implications of new technologies. Diverse teams create more robust solutions. User feedback is invaluable throughout the development process. Continuous learning is necessary to stay relevant in rapidly evolving fields. Balance innovation with practical implementation.`;
  }
  
  if (query.includes('insight') || query.includes('analysis')) {
    return `My analysis of ${podcastTitle} reveals several insights. The speakers emphasize a human-centered approach to technology. They discuss how successful implementation requires both technical excellence and organizational change management. There's a strong focus on responsible innovation and considering long-term impacts. The podcast also highlights the importance of accessibility and designing for diverse user needs.`;
  }
  
  if (query.includes('opinion') || query.includes('perspective') || query.includes('view')) {
    return `In ${podcastTitle}, the speakers offer different perspectives on technology adoption. Some argue for rapid implementation of new technologies, while others advocate for a more measured approach that considers potential societal impacts. They all agree, however, that ethical considerations should be central to technology development.`;
  }
  
  if (query.includes('challenge') || query.includes('problem') || query.includes('issue')) {
    return `The podcast discusses several challenges in the technology space. Balancing innovation with security concerns. Addressing the digital divide and ensuring equitable access. Managing the pace of change in organizations. Developing appropriate regulatory frameworks. Building trust with users and stakeholders.`;
  }
  
  if (query.includes('future') || query.includes('trend') || query.includes('prediction')) {
    return `Regarding future trends discussed in ${podcastTitle}. The speakers predict continued growth in AI and machine learning applications. They anticipate more focus on sustainable technology solutions. There's an expectation that remote and hybrid work models will continue to evolve. They also foresee increased emphasis on privacy-preserving technologies and more sophisticated approaches to data governance.`;
  }
  
  // Default response
  return `Based on ${podcastTitle}, I can provide various insights about the content. You can ask me for a summary, key points, main lessons, or specific aspects of the discussion. For example, try asking "What are the main points of this podcast?" or "Can you summarize this episode?"`;
} 