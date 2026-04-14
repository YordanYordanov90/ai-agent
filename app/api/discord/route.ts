// app/api/discord/route.ts
import { NextRequest } from "next/server";
import { Chat, type Lock, type QueueEntry, type StateAdapter } from "chat";
import { DiscordAdapter } from "@chat-adapter/discord";
import { createCodyAgent } from "@/lib/agent";

const cache = new Map<string, { value: unknown; expiresAt?: number }>();
const listCache = new Map<string, { value: unknown[]; expiresAt?: number }>();
const locks = new Map<string, Lock>();
const queues = new Map<string, QueueEntry[]>();
const subscriptions = new Set<string>();

const isExpired = (expiresAt?: number) =>
  typeof expiresAt === "number" && expiresAt <= Date.now();

const state: StateAdapter = {
  async acquireLock(threadId, ttlMs) {
    const existing = locks.get(threadId);
    if (existing && existing.expiresAt > Date.now()) return null;
    const lock: Lock = {
      threadId,
      token: crypto.randomUUID(),
      expiresAt: Date.now() + ttlMs,
    };
    locks.set(threadId, lock);
    return lock;
  },
  async appendToList(key, value, options) {
    const current = listCache.get(key);
    const next = current ? [...current.value, value] : [value];
    const maxLength = options?.maxLength;
    const finalValue = typeof maxLength === "number" ? next.slice(-maxLength) : next;
    listCache.set(key, {
      value: finalValue,
      expiresAt: options?.ttlMs ? Date.now() + options.ttlMs : undefined,
    });
  },
  async connect() {},
  async delete(key) {
    cache.delete(key);
    listCache.delete(key);
  },
  async dequeue(threadId) {
    const queue = queues.get(threadId);
    if (!queue || queue.length === 0) return null;
    const next = queue.shift() ?? null;
    queues.set(threadId, queue);
    return next;
  },
  async disconnect() {},
  async enqueue(threadId, entry, maxSize) {
    const queue = queues.get(threadId) ?? [];
    queue.push(entry);
    if (queue.length > maxSize) queue.splice(0, queue.length - maxSize);
    queues.set(threadId, queue);
    return queue.length;
  },
  async extendLock(lock, ttlMs) {
    const current = locks.get(lock.threadId);
    if (!current || current.token !== lock.token || current.expiresAt <= Date.now()) {
      return false;
    }
    locks.set(lock.threadId, { ...current, expiresAt: Date.now() + ttlMs });
    return true;
  },
  async forceReleaseLock(threadId) {
    locks.delete(threadId);
  },
  async get<T = unknown>(key: string) {
    const item = cache.get(key);
    if (!item) return null;
    if (isExpired(item.expiresAt)) {
      cache.delete(key);
      return null;
    }
    return item.value as T;
  },
  async getList<T = unknown>(key: string) {
    const item = listCache.get(key);
    if (!item) return [];
    if (isExpired(item.expiresAt)) {
      listCache.delete(key);
      return [];
    }
    return item.value as T[];
  },
  async isSubscribed(threadId) {
    return subscriptions.has(threadId);
  },
  async queueDepth(threadId) {
    return (queues.get(threadId) ?? []).length;
  },
  async releaseLock(lock) {
    const current = locks.get(lock.threadId);
    if (current && current.token === lock.token) locks.delete(lock.threadId);
  },
  async set<T = unknown>(key: string, value: T, ttlMs?: number) {
    cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
  },
  async setIfNotExists(key, value, ttlMs) {
    const existing = cache.get(key);
    if (existing && !isExpired(existing.expiresAt)) return false;
    cache.set(key, {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    });
    return true;
  },
  async subscribe(threadId) {
    subscriptions.add(threadId);
  },
  async unsubscribe(threadId) {
    subscriptions.delete(threadId);
  },
};
const chat = new Chat({
  userName: "cody",
  state,
  adapters: {
    discord: new DiscordAdapter({
      botToken: process.env.DISCORD_BOT_TOKEN,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
      applicationId: process.env.DISCORD_APPLICATION_ID,
    }),
  },
});

const readStringProp = (source: unknown, key: string): string | null => {
  if (typeof source !== "object" || source === null) return null;
  if (!(key in source)) return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
};

chat.onDirectMessage(async (thread, message) => {
  const text = message.text?.trim();
  if (!text) {
    await thread.post("Please provide a message.");
    return;
  }

  const responseText = await createCodyAgent({
    messages: [{ role: "user", content: text }],
    userId: readStringProp(message, "authorId") ?? readStringProp(message, "userId") ?? "discord-user",
    channelId: readStringProp(thread, "id") ?? "discord",
  });
  await thread.post(responseText.text);
});

chat.onNewMention(async (thread, message) => {
  const text = message.text?.trim();
  if (!text) {
    await thread.post("Please provide a message.");
    return;
  }

  const responseText = await createCodyAgent({
    messages: [{ role: "user", content: text }],
    userId: readStringProp(message, "authorId") ?? readStringProp(message, "userId") ?? "discord-user",
    channelId: readStringProp(thread, "id") ?? "discord",
  });
  await thread.post(responseText.text);
});

export async function POST(req: NextRequest) {
  try {
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