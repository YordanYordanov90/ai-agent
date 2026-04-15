import { after } from "next/server";
import { chat } from "@/lib/discord-chat";
import { createCodyAgent } from "@/lib/agent";
import { resolveDiscordApiChannelId } from "@/lib/discord-target-channel";
import { qstashJobSchema, verifyQstashSignature } from "@/lib/qstash";
import { getRedis } from "@/lib/redis";

// Hobby: 1–300s. Pro can raise this in dashboard / plan limits; keep listener under timeout.
export const maxDuration = 300;

const normalizeHost = (host: string) => host.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const inMemoryProcessedMessages = new Map<string, number>();

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
  const bodyContent = truncateForDiscord(content);

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
};

const handleAgentJob = async (payload: {
  text: string;
  userId: string;
  channelId: string;
  messageId: string;
}): Promise<Response> => {
  const doneKey = `qstash:discord:done:${payload.messageId}`;

  const redis = getRedis();
  if (redis) {
    const alreadyDone = await redis.get(doneKey);
    if (alreadyDone) {
      return Response.json({ ok: true, duplicate: true });
    }
  } else {
    const now = Date.now();
    const expiresAt = inMemoryProcessedMessages.get(doneKey);
    if (typeof expiresAt === "number" && expiresAt > now) {
      return Response.json({ ok: true, duplicate: true });
    }
  }

  try {
    const result = await createCodyAgent({
      messages: [{ role: "user", content: payload.text }],
      userId: payload.userId,
      channelId: payload.channelId,
    });

    await postDiscordMessage(payload.channelId, result.text);
    if (redis) {
      await redis.set(doneKey, "1", { ex: 60 * 60 * 24 });
    } else {
      inMemoryProcessedMessages.set(doneKey, Date.now() + 24 * 60 * 60 * 1000);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Discord Gateway] Agent job failed", error);
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
