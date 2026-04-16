// lib/tools/stocks.ts
import { tool } from "ai";
import { z } from "zod";

/** Polygon.io and Massive.com accept the same keys; both hosts work during the rebrand transition. */
const DEFAULT_REST_BASE = "https://api.polygon.io";

/** Only these HTTPS origins may be set via POLYGON_REST_BASE_URL (SSRF-safe). */
const ALLOWED_POLYGON_REST_ORIGINS = new Set([
  "https://api.polygon.io",
  "https://api.massive.com",
]);

const getStockPriceInputSchema = z.object({
  symbol: z.string().describe("Stock ticker, e.g. AAPL, TSLA, NVDA, GOOGL"),
});

function restBaseUrl(): string {
  const fallback = DEFAULT_REST_BASE.replace(/\/$/, "");
  const raw = process.env.POLYGON_REST_BASE_URL?.trim();
  if (!raw) return fallback;

  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(withProto);
  } catch {
    console.warn(
      "[stocks] POLYGON_REST_BASE_URL is not a valid URL; using default https://api.polygon.io."
    );
    return fallback;
  }

  if (parsed.protocol !== "https:") {
    console.warn("[stocks] POLYGON_REST_BASE_URL must use https; using default.");
    return fallback;
  }

  const origin = parsed.origin.toLowerCase();
  if (!ALLOWED_POLYGON_REST_ORIGINS.has(origin)) {
    console.warn(
      `[stocks] POLYGON_REST_BASE_URL origin "${origin}" is not allowlisted; using default.`
    );
    return fallback;
  }

  return origin;
}

/** Polygon/Massive accept the key in query or as Bearer; header avoids key in URLs (logs, proxies). */
function polygonAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

export const getStockPrice = tool({
  description:
    "Get US stock price: last trade when the API plan allows it; otherwise previous trading session close (OHLC) from aggregates.",
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
    const base = restBaseUrl();

    try {
      const lastTradeUrl = `${base}/v2/last/trade/${encodeURIComponent(sym)}`;
      const signal = AbortSignal.timeout(12_000);
      const res = await fetch(lastTradeUrl, { headers: polygonAuthHeaders(key), signal });
      const bodyText = await res.text();

      if (res.ok) {
        let data: { results?: { p?: number; t?: number } };
        try {
          data = JSON.parse(bodyText) as { results?: { p?: number; t?: number } };
        } catch {
          return { error: true as const, symbol: sym, message: "Polygon returned invalid JSON (last trade)." };
        }
        return {
          symbol: sym,
          price: data.results?.p ?? null,
          timestamp: data.results?.t ?? null,
          source: "last_trade" as const,
        };
      }

      // /v2/last/trade often returns 403 NOT_AUTHORIZED on free/starter plans — use previous day bar.
      if (res.status === 403) {
        const prevUrl = `${base}/v2/aggs/ticker/${encodeURIComponent(sym)}/prev?adjusted=true`;
        const prevSignal = AbortSignal.timeout(12_000);
        const prevRes = await fetch(prevUrl, { headers: polygonAuthHeaders(key), signal: prevSignal });
        const prevText = await prevRes.text();

        if (!prevRes.ok) {
          return {
            error: true as const,
            status: prevRes.status,
            symbol: sym,
            message: `Stock data not available (last trade: HTTP 403; previous bar: HTTP ${prevRes.status}).`,
            detail: prevText.slice(0, 300),
          };
        }

        let prevData: {
          results?: Array<{ c?: number; t?: number; o?: number; h?: number; l?: number; v?: number }>;
        };
        try {
          prevData = JSON.parse(prevText) as {
            results?: Array<{ c?: number; t?: number; o?: number; h?: number; l?: number; v?: number }>;
          };
        } catch {
          return { error: true as const, symbol: sym, message: "Polygon returned invalid JSON (previous bar)." };
        }

        const bar = prevData.results?.[0];
        return {
          symbol: sym,
          price: bar?.c ?? null,
          timestamp: bar?.t ?? null,
          open: bar?.o ?? null,
          high: bar?.h ?? null,
          low: bar?.l ?? null,
          volume: bar?.v ?? null,
          source: "previous_trading_session_close" as const,
          note:
            "Last-trade endpoint is not enabled for this API key plan; returned previous session close instead.",
        };
      }

      return {
        error: true as const,
        status: res.status,
        symbol: sym,
        message: `Polygon request failed with HTTP ${res.status}.`,
        detail: bodyText.slice(0, 300),
      };
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      const message = cause instanceof Error ? cause.message : "Unknown error";
      return {
        error: true as const,
        symbol: sym,
        message: timedOut ? "Polygon request timed out after 12s." : `Polygon fetch failed: ${message}`,
      };
    }
  },
});