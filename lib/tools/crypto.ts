// lib/tools/crypto.ts
import { tool } from "ai";
import { z } from "zod";

const getCryptoDataInputSchema = z.object({
  coinId: z
    .string()
    .describe("Coin ID from CoinGecko, e.g. bitcoin, ethereum, solana, cardano"),
});

export const getCryptoData = tool({
  description: "Get real-time price, 24h change, volume and market cap for any cryptocurrency",
  inputSchema: getCryptoDataInputSchema,
  execute: async ({ coinId }) => {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );

    if (!res.ok) throw new Error("CoinGecko API error");
    const data = await res.json();
    return data[coinId] || { error: "Coin not found" };
  },
});