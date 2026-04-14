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
    // Free tier Polygon.io (you can get free key at polygon.io)
    const res = await fetch(
      `https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${process.env.POLYGON_API_KEY}`
    );

    if (!res.ok) throw new Error("Polygon API error");
    const data = await res.json() as { results?: { p?: number; t?: number } };
    return {
      symbol,
      price: data.results?.p ?? null,
      timestamp: data.results?.t ?? null,
    };
  },
});