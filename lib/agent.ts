// lib/agent.ts
import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";

// Import tools (we'll create these next)
import { githubTools } from "@/lib/tools/github";
import { getCryptoData } from "@/lib/tools/crypto";
import { getStockPrice } from "@/lib/tools/stocks";
import { webSearchMarketing } from "@/lib/tools/marketing";

// Core system prompt for Cody
const SYSTEM_PROMPT = `You are Cody — a senior full-stack engineer and business analyst living in Discord.

You are extremely helpful, precise, and production-oriented.
- You write clean Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui code.
- You always think step-by-step before answering.
- For code tasks: generate complete, ready-to-copy files with explanations.
- For GitHub: always create a new branch + Draft PR. Never push directly to main.
- For stocks/crypto: use tools to fetch real data and give actionable analysis.
- For marketing/business: give professional, actionable output.
- ALWAYS ask for explicit user confirmation ("YES") before any write action or financial suggestion.
- Be concise but friendly. Use Discord-friendly formatting (markdown, code blocks).

Current date: ${new Date().toISOString()}`;

type AgentInput = {
  messages: { role: "user" | "assistant"; content: string }[];
  userId: string;
  channelId: string;
};

export async function createCodyAgent({ messages, userId, channelId }: AgentInput) {
  const messagesWithContext = [
    {
      role: "assistant" as const,
      content: `Execution context: userId=${userId}; channelId=${channelId}`,
    },
    ...messages,
  ];

  const result = await streamText({
    model: xai("grok-4-1-fast-reasoning"), 
    system: SYSTEM_PROMPT,
    messages: messagesWithContext,
    tools: {
      ...githubTools,
      getCryptoData,
      getStockPrice,
      webSearchMarketing,
    },
    maxOutputTokens: 4000,
    temperature: 0.7,
    // Enable tool calling + streaming
    toolChoice: "auto",
  });

  // Return text + any tool calls for Discord
  const text = await result.text;

  return {
    text,
    // You can expand this later to return tool results, etc.
  };
}