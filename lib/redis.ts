import { Redis } from "@upstash/redis";

type GlobalWithRedis = typeof globalThis & {
  __codyRedisClient?: Redis | null;
};

export const getRedis = (): Redis | null => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const globalScope = globalThis as GlobalWithRedis;
  if (!globalScope.__codyRedisClient) {
    globalScope.__codyRedisClient = Redis.fromEnv();
  }

  return globalScope.__codyRedisClient;
};

