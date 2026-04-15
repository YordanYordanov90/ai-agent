/**
 * Keeps the Discord Gateway WebSocket alive so @-mentions and DMs reach your handlers.
 *
 * **Vercel Hobby:** Built-in `vercel.json` crons are limited to **once per day**, so you
 * cannot use Vercel Cron for every-9-minute pings. Use an external scheduler instead, for example:
 * - [Upstash QStash](https://upstash.com/docs/qstash): schedule a GET to this route every
 *   ~3–4 minutes on Hobby (must overlap the listener window; max function time is 300s).
 *   Set a custom header
 *   `Authorization: Bearer <CRON_SECRET>` (same secret as `CRON_SECRET` in Vercel).
 * - Any other HTTPS cron (GitHub Actions, cron-job.org, etc.) with the same auth header.
 *
 * **Vercel Pro:** You may add a `vercel.json` cron (e.g. path `/api/discord/gateway`, schedule
 * every 9 minutes per Vercel cron syntax), plus `CRON_SECRET`.
 */
import { after } from "next/server";
import { chat } from "@/lib/discord-chat";

// Hobby: 1–300s. Pro can raise this in dashboard / plan limits; keep listener under timeout.
export const maxDuration = 300;

const normalizeHost = (host: string) => host.replace(/^https?:\/\//, "").replace(/\/+$/, "");

export async function GET(request: Request): Promise<Response> {
  // const cronSecret = process.env.CRON_SECRET;
  // if (!cronSecret) {
  //   return new Response("CRON_SECRET not configured", { status: 500 });
  // }

  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${cronSecret}`) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const hostSource = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!hostSource) {
    return new Response("VERCEL_URL not configured", { status: 500 });
  }

  const webhookUrl = `https://${normalizeHost(hostSource)}/api/discord`;
  // Slightly under maxDuration (seconds) so the worker is not cut off mid-flight.
  const durationMs = Math.max(1, (maxDuration - 10) * 1000);

  await chat.initialize();
  const discordAdapter = chat.getAdapter("discord");

  return discordAdapter.startGatewayListener(
    { waitUntil: (task) => after(() => task) },
    durationMs,
    undefined,
    webhookUrl
  );
}
