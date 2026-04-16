import { getRedis } from "@/lib/redis";
import { z } from "zod";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const chatMessageSchema = z.object({
  role: z.union([z.literal("user"), z.literal("assistant")]),
  content: z.string(),
});

const MAX_TURNS = 20;
const TTL_DAYS = 30;
const TTL_SECONDS = TTL_DAYS * 24 * 60 * 60;

const memoryKey = (channelId: string): string => `cody:memory:${channelId}`;

const parseChatMessage = (raw: unknown): ChatMessage | null => {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    const result = chatMessageSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export async function getConversationHistory(channelId: string): Promise<ChatMessage[]> {
  const redis = getRedis();
  if (!redis) {
    console.warn(`[Memory] Redis unavailable; returning empty history for channel ${channelId}`);
    return [];
  }

  try {
    const rawHistory = await redis.lrange(memoryKey(channelId), 0, -1);
    const history = rawHistory
      .map((item) => parseChatMessage(typeof item === "string" ? item : JSON.stringify(item)))
      .filter((item): item is ChatMessage => item !== null);
    console.log(`[Memory] Loaded ${history.length} turns for channel ${channelId}`);
    return history;
  } catch (error) {
    console.error(`[Memory] Failed loading history for channel ${channelId}`, error);
    return [];
  }
}

export async function appendToConversation(
  channelId: string,
  userText: string,
  assistantText: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    console.warn(`[Memory] Redis unavailable; skipping append for channel ${channelId}`);
    return;
  }

  const key = memoryKey(channelId);
  try {
    await redis.rpush(
      key,
      JSON.stringify({ role: "user", content: userText } satisfies ChatMessage),
      JSON.stringify({ role: "assistant", content: assistantText } satisfies ChatMessage)
    );
    await redis.ltrim(key, -MAX_TURNS, -1);
    await redis.expire(key, TTL_SECONDS);
    console.log(`[Memory] Appended 2 turns for channel ${channelId}`);
  } catch (error) {
    console.error(`[Memory] Failed appending turns for channel ${channelId}`, error);
  }
}
