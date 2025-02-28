import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Check if Anthropic API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    
    // Log the request for debugging
    console.log("Chat request received with", messages.length, "messages");
    
    const result = await streamText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant that provides insights about podcasts",
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in Anthropic chat API:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred processing your request" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
