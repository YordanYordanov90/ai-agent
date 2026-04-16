// app/api/discord/route.ts
import { NextRequest } from "next/server";
import { getDiscordChat, getDiscordState } from "@/lib/discord-chat";
import { checkDiscordRateLimit } from "@/lib/rate-limit";
import { resolveDiscordApiChannelId } from "@/lib/discord-target-channel";
import { publishQstashJob } from "@/lib/qstash";

const readStringProp = (source: unknown, key: string): string | null => {
  if (typeof source !== "object" || source === null) return null;
  if (!(key in source)) return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

/** Short acknowledgment while QStash runs the agent (Discord shows this immediately). */
const QUEUED_REPLY_DM =
  "**Acknowledged.** I'm drafting a response now — I'll post it here in a moment.";
const QUEUED_REPLY_MENTION =
  "**Acknowledged.** I'm drafting a response now — I'll follow up in this thread shortly.";
const RATE_LIMIT_REPLY_USER =
  "You're sending messages too quickly. Please wait about {seconds}s, then try again.";
const RATE_LIMIT_REPLY_CHANNEL =
  "This channel is temporarily rate-limited due to high traffic. Please wait about {seconds}s and retry.";

const buildRateLimitReply = (reason: "user" | "channel", seconds: number): string =>
  (reason === "user" ? RATE_LIMIT_REPLY_USER : RATE_LIMIT_REPLY_CHANNEL).replace(
    "{seconds}",
    String(seconds)
  );

const HANDLERS_REGISTERED_KEY = "__codyDiscordHandlersRegistered";

const registerDiscordHandlers = (): void => {
  const chat = getDiscordChat();
  const state = getDiscordState();

  chat.onDirectMessage(async (thread, message) => {
    const text = message.text?.trim();
    if (!text) {
      await thread.post("Please provide a message.");
      return;
    }

    const userId =
      readStringProp(message, "authorId") ??
      readStringProp(message, "userId") ??
      "discord-user";
    const encodedThreadId = readStringProp(thread, "id");
    const messageId = readStringProp(message, "id") ?? crypto.randomUUID();

    let discordChannelId: string;
    try {
      discordChannelId = resolveDiscordApiChannelId(encodedThreadId ?? "");
    } catch (error) {
      console.error("[Discord Route] Invalid thread id for QStash (DM)", error);
      await thread.post(
        "Could not route your message to the worker. Please try again or contact support."
      );
      return;
    }

    const limitResult = await checkDiscordRateLimit({
      userId,
      channelId: discordChannelId,
    });
    if (!limitResult.allowed) {
      console.warn("[RateLimit] denied discord dm", {
        reason: limitResult.reason,
        retryAfterSeconds: limitResult.retryAfterSeconds,
        userId,
        channelId: discordChannelId,
        userCount: limitResult.userCount,
        channelCount: limitResult.channelCount,
        windowSlot: limitResult.windowSlot,
      });
      await thread.post(
        buildRateLimitReply(limitResult.reason ?? "user", limitResult.retryAfterSeconds)
      );
      return;
    }
    console.log("[RateLimit] allowed discord dm", {
      userId,
      channelId: discordChannelId,
      userCount: limitResult.userCount,
      channelCount: limitResult.channelCount,
      windowSlot: limitResult.windowSlot,
    });

    try {
      await publishQstashJob({
        type: "agent",
        text,
        userId,
        channelId: discordChannelId,
        messageId,
      });
      await state.subscribe(discordChannelId);
    } catch (error) {
      console.error("[Discord Route] QStash publish failed (DM)", error);
      await thread.post(
        "I could not queue your request. Check QStash configuration and try again."
      );
      return;
    }

    await thread.post(QUEUED_REPLY_DM);
  });

  chat.onNewMention(async (thread, message) => {
    const text = message.text?.trim();
    if (!text) {
      await thread.post("Please provide a message.");
      return;
    }

    const userId =
      readStringProp(message, "authorId") ??
      readStringProp(message, "userId") ??
      "discord-user";
    const encodedThreadId = readStringProp(thread, "id");
    const messageId = readStringProp(message, "id") ?? crypto.randomUUID();

    let discordChannelId: string;
    try {
      discordChannelId = resolveDiscordApiChannelId(encodedThreadId ?? "");
    } catch (error) {
      console.error("[Discord Route] Invalid thread id for QStash (mention)", error);
      await thread.post(
        "Could not route your message to the worker. Please try again or contact support."
      );
      return;
    }

    const limitResult = await checkDiscordRateLimit({
      userId,
      channelId: discordChannelId,
    });
    if (!limitResult.allowed) {
      console.warn("[RateLimit] denied discord mention", {
        reason: limitResult.reason,
        retryAfterSeconds: limitResult.retryAfterSeconds,
        userId,
        channelId: discordChannelId,
        userCount: limitResult.userCount,
        channelCount: limitResult.channelCount,
        windowSlot: limitResult.windowSlot,
      });
      await thread.post(
        buildRateLimitReply(limitResult.reason ?? "user", limitResult.retryAfterSeconds)
      );
      return;
    }
    console.log("[RateLimit] allowed discord mention", {
      userId,
      channelId: discordChannelId,
      userCount: limitResult.userCount,
      channelCount: limitResult.channelCount,
      windowSlot: limitResult.windowSlot,
    });

    try {
      await publishQstashJob({
        type: "agent",
        text,
        userId,
        channelId: discordChannelId,
        messageId,
      });
      await state.subscribe(discordChannelId);
    } catch (error) {
      console.error("[Discord Route] QStash publish failed (mention)", error);
      await thread.post(
        "I could not queue your request. Check QStash configuration and try again."
      );
      return;
    }

    await thread.post(QUEUED_REPLY_MENTION);
  });
};

const ensureDiscordHandlersRegistered = (): void => {
  const g = globalThis as typeof globalThis & Record<string, boolean | undefined>;
  if (g[HANDLERS_REGISTERED_KEY]) return;
  registerDiscordHandlers();
  g[HANDLERS_REGISTERED_KEY] = true;
};

export async function POST(req: NextRequest) {
  try {
    ensureDiscordHandlersRegistered();
    const chat = getDiscordChat();
    return await chat.webhooks.discord(req);
  } catch (error) {
    console.error("[Discord Route] Error:", error);

    // Fallback error response (Discord will see this if something breaks)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}

// Optional GET for health check (useful during Discord verification)
export async function GET() {
  return new Response("Cody Discord endpoint is live ✅", { status: 200 });
}