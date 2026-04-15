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
    const signal = AbortSignal.timeout(12_000);
    let res: Response;
    try {
      res = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`,
        { signal }
      );
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      return {
        query,
        results: [] as Array<{ text: string; url: string }>,
        summary: timedOut
          ? "Search timed out after 12s. Answer from general knowledge if appropriate."
          : "Search request failed (network). Answer from general knowledge if appropriate.",
      };
    }

    if (!res.ok) {
      return {
        query,
        results: [] as Array<{ text: string; url: string }>,
        summary: `Search request failed (HTTP ${res.status}). Answer from general knowledge if appropriate.`,
      };
    }

    let data: {
      Abstract?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
    };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return {
        query,
        results: [] as Array<{ text: string; url: string }>,
        summary: "Search returned invalid JSON. Answer from general knowledge if appropriate.",
      };
    }

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