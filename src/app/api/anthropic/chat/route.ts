import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) {
    return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const { messages } = body as { messages: Parameters<typeof convertToCoreMessages>[0] };
  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages: convertToCoreMessages(messages),
    system: "You are a helpful AI assistant",
  });

  return result.toDataStreamResponse();
}
