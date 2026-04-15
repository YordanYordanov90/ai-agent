// lib/tools/crypto.ts
import { tool } from "ai";
import { z } from "zod";

const getCryptoDataInputSchema = z.object({
  coinId: z
    .string()
    .describe("Coin ID from CoinGecko, e.g. bitcoin, ethereum, solana, cardano"),
});

const coingeckoHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    // CoinGecko may block anonymous serverless traffic; identify the client.
    "User-Agent": "CodyBot/1.0 (https://github.com/vercel/chat)",
  };
  const demoKey = process.env.COINGECKO_API_KEY;
  if (demoKey) {
    // Demo plan (https://www.coingecko.com/en/api). Pro plan: use x-cg-pro-api-key + pro endpoint separately if needed.
    headers["x-cg-demo-api-key"] = demoKey;
  }
  return headers;
};

export const getCryptoData = tool({
  description: "Get real-time price, 24h change, volume and market cap for any cryptocurrency",
  inputSchema: getCryptoDataInputSchema,
  execute: async ({ coinId }) => {
    const id = coinId.trim().toLowerCase();
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      id
    )}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`;

    try {
      const res = await fetch(url, { headers: coingeckoHeaders() });
      const bodyText = await res.text();

      if (!res.ok) {
        return {
          error: true as const,
          status: res.status,
          message:
            res.status === 429
              ? "CoinGecko rate limit (try again shortly, or set COINGECKO_API_KEY for higher limits)."
              : `CoinGecko request failed with HTTP ${res.status}.`,
          detail: bodyText.slice(0, 300),
        };
      }

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(bodyText) as Record<string, unknown>;
      } catch {
        return { error: true as const, message: "CoinGecko returned invalid JSON." };
      }

      const row = data[id];
      if (!row || typeof row !== "object") {
        return {
          error: true as const,
          message: `No data for "${id}". Use a CoinGecko id like "bitcoin" or "ethereum".`,
        };
      }

      return row as Record<string, unknown>;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown error";
      return { error: true as const, message: `CoinGecko fetch failed: ${message}` };
    }
  },
});