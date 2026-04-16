import type { Redis } from "@upstash/redis";
import type { Lock, QueueEntry, StateAdapter } from "chat";

/** Namespace for Chat SDK state; avoids collision with `qstash:discord:*` keys. */
const P = "cody:chat:";

const kvKey = (key: string) => `${P}kv:${key}`;
const listKey = (key: string) => `${P}list:${key}`;
const lockKey = (threadId: string) => `${P}lock:${threadId}`;
const queueKey = (threadId: string) => `${P}queue:${threadId}`;
const SUBS_KEY = `${P}subs`;
const SUBS_TTL_SECONDS = 7 * 24 * 60 * 60;

const isExpired = (expiresAt?: number) =>
  typeof expiresAt === "number" && expiresAt <= Date.now();

const encodeJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
  } catch {
    return JSON.stringify({ __fallback: String(value) });
  }
};

const decodeJson = <T>(raw: string | null): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/** In-process state (dev / fallback when Redis is unset). */
export function createMemoryStateAdapter(): StateAdapter {
  const cache = new Map<string, { value: unknown; expiresAt?: number }>();
  const listCache = new Map<string, { value: unknown[]; expiresAt?: number }>();
  const locks = new Map<string, Lock>();
  const queues = new Map<string, QueueEntry[]>();
  const subscriptions = new Set<string>();

  return {
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
      console.log(`[State] subscribed to ${threadId} (memory)`);
      subscriptions.add(threadId);
    },
    async unsubscribe(threadId) {
      subscriptions.delete(threadId);
    },
  };
}

const LUA_RELEASE_LOCK = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

const LUA_EXTEND_LOCK = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("pexpire", KEYS[1], tonumber(ARGV[2]))
else
  return 0
end
`;

export function createRedisStateAdapter(redis: Redis): StateAdapter {
  return {
    async acquireLock(threadId, ttlMs) {
      const token = crypto.randomUUID();
      const k = lockKey(threadId);
      const acquired = await redis.set(k, token, { nx: true, px: ttlMs });
      if (acquired === null) return null;
      return {
        threadId,
        token,
        expiresAt: Date.now() + ttlMs,
      };
    },

    async appendToList(key, value, options) {
      const lk = listKey(key);
      await redis.rpush(lk, encodeJson(value));
      if (typeof options?.maxLength === "number") {
        await redis.ltrim(lk, -options.maxLength, -1);
      }
      if (typeof options?.ttlMs === "number") {
        await redis.pexpire(lk, options.ttlMs);
      }
    },

    async connect() {},

    async delete(key) {
      await redis.del(kvKey(key), listKey(key));
    },

    async dequeue(threadId) {
      const raw = await redis.lpop(queueKey(threadId));
      if (raw === null) return null;
      const parsed = decodeJson<QueueEntry>(typeof raw === "string" ? raw : String(raw));
      return parsed;
    },

    async disconnect() {},

    async enqueue(threadId, entry, maxSize) {
      const qk = queueKey(threadId);
      await redis.rpush(qk, encodeJson(entry));
      let len = await redis.llen(qk);
      if (len > maxSize) {
        await redis.ltrim(qk, -maxSize, -1);
        len = maxSize;
      }
      return len;
    },

    async extendLock(lock, ttlMs) {
      const n = await redis.eval(LUA_EXTEND_LOCK, [lockKey(lock.threadId)], [
        lock.token,
        String(ttlMs),
      ]);
      return Number(n) === 1;
    },

    async forceReleaseLock(threadId) {
      await redis.del(lockKey(threadId));
    },

    async get<T = unknown>(key: string) {
      const raw = await redis.get(kvKey(key));
      if (raw === null) return null;
      return decodeJson<T>(typeof raw === "string" ? raw : JSON.stringify(raw));
    },

    async getList<T = unknown>(key: string) {
      const raw = await redis.lrange(listKey(key), 0, -1);
      if (!raw.length) return [];
      const out: T[] = [];
      for (const row of raw) {
        const s = typeof row === "string" ? row : JSON.stringify(row);
        const v = decodeJson<T>(s);
        if (v !== null) out.push(v);
      }
      return out;
    },

    async isSubscribed(threadId) {
      const m = await redis.sismember(SUBS_KEY, threadId);
      return m === 1;
    },

    async queueDepth(threadId) {
      return redis.llen(queueKey(threadId));
    },

    async releaseLock(lock) {
      await redis.eval(LUA_RELEASE_LOCK, [lockKey(lock.threadId)], [lock.token]);
    },

    async set<T = unknown>(key: string, value: T, ttlMs?: number) {
      if (ttlMs !== undefined) {
        await redis.set(kvKey(key), encodeJson(value), { px: ttlMs });
      } else {
        await redis.set(kvKey(key), encodeJson(value));
      }
    },

    async setIfNotExists(key, value, ttlMs) {
      const acquired =
        ttlMs !== undefined
          ? await redis.set(kvKey(key), encodeJson(value), { nx: true, px: ttlMs })
          : await redis.set(kvKey(key), encodeJson(value), { nx: true });
      return acquired !== null;
    },

    async subscribe(threadId) {
      console.log(`[State] subscribed to ${threadId} (Redis)`);
      await redis.sadd(SUBS_KEY, threadId);
      await redis.expire(SUBS_KEY, SUBS_TTL_SECONDS);
    },

    async unsubscribe(threadId) {
      await redis.srem(SUBS_KEY, threadId);
    },
  };
}
