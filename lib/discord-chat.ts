import { Chat, type Lock, type QueueEntry, type StateAdapter } from "chat";
import { DiscordAdapter } from "@chat-adapter/discord";

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

export const chat = new Chat({
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
