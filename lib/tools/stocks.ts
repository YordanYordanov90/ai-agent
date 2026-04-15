// lib/tools/stocks.ts
import { tool } from "ai";
import { z } from "zod";

const getStockPriceInputSchema = z.object({
  symbol: z.string().describe("Stock ticker, e.g. AAPL, TSLA, NVDA, GOOGL"),
});

export const getStockPrice = tool({
  description: "Get real-time stock price, change and volume for US stocks",
  inputSchema: getStockPriceInputSchema,
  execute: async ({ symbol }) => {
    const key = process.env.POLYGON_API_KEY?.trim();
    if (!key) {
      return {
        error: true as const,
        message: "POLYGON_API_KEY is not configured on the server.",
      };
    }

    const sym = symbol.trim().toUpperCase();
    const url = `https://api.polygon.io/v2/last/trade/${encodeURIComponent(sym)}?apiKey=${encodeURIComponent(key)}`;

    try {
      const res = await fetch(url);
      const bodyText = await res.text();

      if (!res.ok) {
        return {
          error: true as const,
          status: res.status,
          symbol: sym,
          message: `Polygon request failed with HTTP ${res.status}.`,
          detail: bodyText.slice(0, 300),
        };
      }

      let data: { results?: { p?: number; t?: number } };
      try {
        data = JSON.parse(bodyText) as { results?: { p?: number; t?: number } };
      } catch {
        return { error: true as const, symbol: sym, message: "Polygon returned invalid JSON." };
      }

      return {
        symbol: sym,
        price: data.results?.p ?? null,
        timestamp: data.results?.t ?? null,
      };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown error";
      return { error: true as const, symbol: sym, message: `Polygon fetch failed: ${message}` };
    }
  },
});