export const runtime = "edge";

export async function GET() {
  const apiStatus = {
    anthropic: {
      configured: !!process.env.ANTHROPIC_API_KEY,
      key: process.env.ANTHROPIC_API_KEY ? 
        `${process.env.ANTHROPIC_API_KEY.substring(0, 4)}...${process.env.ANTHROPIC_API_KEY.substring(process.env.ANTHROPIC_API_KEY.length - 4)}` : 
        null,
      note: "Requires paid credits"
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      key: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 4)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 
        null,
      note: "Free tier available with API key"
    },
    huggingface: {
      configured: true,
      key: "Not required for demo",
      note: "Demo implementation (no API key needed)"
    }
  };

  return new Response(
    JSON.stringify(apiStatus),
    { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    }
  );
} 