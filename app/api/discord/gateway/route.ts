import { after } from "next/server";
import { getDiscordChat } from "@/lib/discord-chat";
import { createCodyAgent } from "@/lib/agent";
import { resolveDiscordApiChannelId } from "@/lib/discord-target-channel";
import { appendToConversation, getConversationHistory, type ChatMessage } from "@/lib/memory";
import { qstashJobSchema, verifyQstashSignature } from "@/lib/qstash";
import { getRedis } from "@/lib/redis";

// Hobby: 1–300s. Pro can raise this in dashboard / plan limits; keep listener under timeout.
export const maxDuration = 300;

/** In-memory dedupe when Redis is unavailable; entries are pruned on each use. */
const memoryClaim = new Map<string, number>();
const memoryDone = new Map<string, number>();
let redisFallbackWarned = false;
const IS_PRODUCTION_RUNTIME = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

const pruneMemoryDedupeMaps = (): void => {
  const now = Date.now();
  for (const [k, exp] of memoryClaim) {
    if (exp <= now) memoryClaim.delete(k);
  }
  for (const [k, exp] of memoryDone) {
    if (exp <= now) memoryDone.delete(k);
  }
};

const DISCORD_MAX_MESSAGE_LENGTH = 2000;

const truncateForDiscord = (content: string): string => {
  if (content.length <= DISCORD_MAX_MESSAGE_LENGTH) return content;
  const suffix = "\n\n_(truncated)_";
  const max = DISCORD_MAX_MESSAGE_LENGTH - suffix.length;
  return `${content.slice(0, Math.max(0, max))}${suffix}`;
};

const postDiscordMessage = async (channelId: string, content: string): Promise<void> => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN not configured");
  }

  const targetChannelId = channelId.startsWith("discord:")
    ? resolveDiscordApiChannelId(channelId)
    : channelId;
  const trimmed = content.trim();
  const bodyContent = truncateForDiscord(
    trimmed.length > 0
      ? trimmed
      : "No response text was produced. Please try again. If this keeps happening, check Vercel logs for the gateway worker."
  );

  const response = await fetch(
    `https://discord.com/api/v10/channels/${targetChannelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: bodyContent }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord post failed (${response.status}): ${body}`);
  }
};

const startGatewayKeepalive = async (): Promise<Response> => {
  const hostSource = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!hostSource) {
    return new Response("VERCEL_URL not configured", { status: 500 });
  }

  const host = hostSource.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const webhookUrl = `https://${host}/api/discord`;
  // Slightly under maxDuration (seconds) so the worker is not cut off mid-flight.
  const durationMs = Math.max(1, (maxDuration - 10) * 1000);
  const chat = getDiscordChat();

  await chat.initialize();
  const discordAdapter = chat.getAdapter("discord");

  return discordAdapter.startGatewayListener(
    { waitUntil: (task: Promise<unknown>) => after(() => task) },
    durationMs,
    undefined,
    webhookUrl
  );
};

const handleAgentJob = async (payload: {
  text: string;
  userId: string;
  channelId: string;
  messageId: string;
}): Promise<Response> => {
  const type = "agent" as const;
  const { messageId } = payload;
  const claimKey = `qstash:discord:claim:${messageId}`;
  const doneKey = `qstash:discord:done:${messageId}`;

  const redis = getRedis();
  if (redis) {
    const alreadyDone = await redis.get(doneKey);
    if (alreadyDone) {
      console.log(`[QStash] ${type} ${messageId} - duplicate`);
      return Response.json({ ok: true, duplicate: true });
    }
    const acquired = await redis.set(claimKey, "1", { nx: true, ex: 300 });
    if (acquired === null) {
      console.log(`[QStash] ${type} ${messageId} - duplicate`);
      return Response.json({ ok: true, duplicate: true });
    }
  } else {
    if (IS_PRODUCTION_RUNTIME) {
      console.error("[QStash] Redis required for dedupe in production runtime");
      return Response.json(
        { error: "Redis is required for Discord worker dedupe in production." },
        { status: 503 }
      );
    }
    if (!redisFallbackWarned) {
      redisFallbackWarned = true;
      console.warn("[QStash] Redis not available – falling back to in-memory dedupe");
    }
    pruneMemoryDedupeMaps();
    const now = Date.now();
    const doneExp = memoryDone.get(messageId);
    if (typeof doneExp === "number" && doneExp > now) {
      console.log(`[QStash] ${type} ${messageId} - duplicate`);
      return Response.json({ ok: true, duplicate: true });
    }
    const claimExp = memoryClaim.get(messageId);
    if (typeof claimExp === "number" && claimExp > now) {
      console.log(`[QStash] ${type} ${messageId} - duplicate`);
      return Response.json({ ok: true, duplicate: true });
    }
    memoryClaim.set(messageId, now + 300 * 1000);
  }

  try {
    const history = await getConversationHistory(payload.channelId);
    console.log(`[Memory] Loaded ${history.length} turns for channel ${payload.channelId}`);
    const messages: ChatMessage[] = [
      ...history,
      { role: "user", content: payload.text },
    ];

    const result = await createCodyAgent({
      messages,
      userId: payload.userId,
      channelId: payload.channelId,
    });
    const assistantText = await result.text;

    await postDiscordMessage(payload.channelId, assistantText);

    if (redis) {
      await appendToConversation(payload.channelId, payload.text, assistantText);
      console.log(`[Memory] Appended user+assistant turns for channel ${payload.channelId}`);
      await redis.set(doneKey, "1", { ex: 86400 });
      await redis.del(claimKey);
    } else {
      pruneMemoryDedupeMaps();
      memoryClaim.delete(messageId);
      memoryDone.set(messageId, Date.now() + 86400 * 1000);
    }

    console.log(`[QStash] ${type} ${messageId} - executed`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Discord Gateway] Agent job failed", error);
    if (redis) {
      await redis.del(claimKey);
    } else {
      pruneMemoryDedupeMaps();
      memoryClaim.delete(messageId);
    }
    console.log(`[QStash] ${messageId} - claim released (agent failed, retry eligible)`);

    try {
      await postDiscordMessage(
        payload.channelId,
        "I hit an error while processing your request. Please try again in a moment."
      );
    } catch (fallbackError) {
      console.error("[Discord Gateway] Error fallback post failed", fallbackError);
    }
    return Response.json({ ok: false }, { status: 500 });
  }
};

const handler = async (request: Request): Promise<Response> => {
  try {
    const signature = request.headers.get("upstash-signature");
    const rawBody = await request.text();
    const verified = await verifyQstashSignature({
      signature,
      body: rawBody,
    });
    if (!verified) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const parsed = qstashJobSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.error("[Discord Gateway] QStash payload validation failed", parsed.error);
      if (process.env.NODE_ENV === "production") {
        return Response.json({ error: "Invalid QStash payload" }, { status: 400 });
      }
      return Response.json(
        { error: "Invalid QStash payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.type === "keepalive") {
      return startGatewayKeepalive();
    }

    return handleAgentJob(parsed.data);
  } catch (error) {
    console.error("[Discord Gateway] Worker error", error);
    return Response.json({ error: "Failed to process QStash request" }, { status: 500 });
  }
};

export const POST = handler;

export async function GET(): Promise<Response> {
  return new Response("Use QStash signed POST for this endpoint.", { status: 405 });
}
