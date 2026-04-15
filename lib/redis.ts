import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export const getRedis = (): Redis | null => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redisClient) {
    redisClient = Redis.fromEnv();
  }

  return redisClient;
};

