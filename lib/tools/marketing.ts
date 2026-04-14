// lib/tools/marketing.ts
import { tool } from "ai";
import { z } from "zod";

const webSearchMarketingInputSchema = z.object({
  query: z
    .string()
    .describe("Search query, e.g. 'best AI coding agent marketing strategies 2026'"),
});

export const webSearchMarketing = tool({
  description: "Search the web for competitor analysis, SEO ideas, marketing strategies or campaign inspiration",
  inputSchema: webSearchMarketingInputSchema,
  execute: async ({ query }) => {
    // Simple free search fallback (you can upgrade to Serper, Tavily, or Exa later)
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`
    );

    if (!res.ok) throw new Error("Search failed");
    const data = await res.json() as {
      Abstract?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };
    const topicResults = (data.RelatedTopics ?? [])
      .flatMap((item) => ("Topics" in item && Array.isArray(item.Topics) ? item.Topics : [item]))
      .map((item) => ({
        text: item.Text ?? "",
        url: item.FirstURL ?? "",
      }))
      .filter((item) => item.text.length > 0 || item.url.length > 0)
      .slice(0, 5);
    const abstractResult =
      data.Abstract && data.AbstractURL
        ? [{ text: data.Abstract, url: data.AbstractURL }]
        : [];
    const results = [...abstractResult, ...topicResults].slice(0, 5);

    return {
      query,
      results,
      summary: "Marketing insights retrieved (expand with paid search API for better results)",
    };
  },
});