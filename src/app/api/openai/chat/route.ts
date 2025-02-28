import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();
    
    // Log the request for debugging
    console.log("OpenAI chat request received with", messages.length, "messages");
    
    // Use GPT-3.5 Turbo which is available on the free tier
    const modelName = "gpt-3.5-turbo";
    
    const result = await streamText({
      model: openai(modelName),
      messages: convertToCoreMessages(messages),
      system: "You are a helpful AI assistant that provides insights about podcasts",
    });

    // Add custom headers to the response
    const response = result.toDataStreamResponse();
    const headers = new Headers(response.headers);
    headers.set('x-model-used', `GPT-3.5 Turbo (Free)`);
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.error("Error in OpenAI chat API:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An error occurred processing your request" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
