import { getRedis } from "@/lib/redis";

const WINDOW_MS = 30_000;
const KEY_TTL_SECONDS = 60;

const USER_LIMIT = 10;
const CHANNEL_LIMIT = 40;

const WEB_IP_LIMIT = 5;
const WEB_UNKNOWN_IP_LIMIT = 2;

type RateLimitReason = "user" | "channel";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: RateLimitReason;
  userCount?: number;
  channelCount?: number;
  windowSlot?: number;
};

const currentWindowSlot = (): number => Math.floor(Date.now() / WINDOW_MS);

const windowKey = (prefix: string, id: string, windowSlot: number): string =>
  `${prefix}:${id}:${windowSlot}`;

const retryAfterSeconds = (): number => {
  const elapsed = Date.now() % WINDOW_MS;
  return Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
};

async function incrementWindowCounter(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    throw new Error("Redis unavailable");
  }
  const count = await redis.incr(key);
  await redis.expire(key, KEY_TTL_SECONDS);
  return count;
}

export async function checkDiscordRateLimit(input: {
  userId: string;
  channelId: string;
}): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowSlot = currentWindowSlot();
  const waitSeconds = retryAfterSeconds();

  if (!redis) {
    return { allowed: true, retryAfterSeconds: waitSeconds, windowSlot };
  }

  try {
    const userKey = windowKey("cody:rl:discord:user", input.userId, windowSlot);
    const channelKey = windowKey("cody:rl:discord:channel", input.channelId, windowSlot);

    const userCount = await incrementWindowCounter(userKey);

    if (userCount > USER_LIMIT) {
      return {
        allowed: false,
        reason: "user",
        retryAfterSeconds: waitSeconds,
        userCount,
        windowSlot,
      };
    }

    const channelCount = await incrementWindowCounter(channelKey);

    if (channelCount > CHANNEL_LIMIT) {
      return {
        allowed: false,
        reason: "channel",
        retryAfterSeconds: waitSeconds,
        userCount,
        channelCount,
        windowSlot,
      };
    }

    return {
      allowed: true,
      retryAfterSeconds: waitSeconds,
      userCount,
      channelCount,
      windowSlot,
    };
  } catch (error) {
    console.warn("[RateLimit] Redis check failed; allowing request", error);
    return { allowed: true, retryAfterSeconds: waitSeconds, windowSlot };
  }
}

export async function checkWebAgentRateLimit(
  clientIp: string
): Promise<RateLimitResult> {
  const redis = getRedis();
  const windowSlot = currentWindowSlot();
  const waitSeconds = retryAfterSeconds();
  const limit =
    clientIp === "unknown" ? WEB_UNKNOWN_IP_LIMIT : WEB_IP_LIMIT;

  if (!redis) {
    return { allowed: true, retryAfterSeconds: waitSeconds, windowSlot };
  }

  try {
    const ipKey = windowKey("cody:rl:web:ip", clientIp, windowSlot);
    const count = await incrementWindowCounter(ipKey);

    if (count > limit) {
      return {
        allowed: false,
        reason: "user",
        retryAfterSeconds: waitSeconds,
        userCount: count,
        windowSlot,
      };
    }

    return {
      allowed: true,
      retryAfterSeconds: waitSeconds,
      userCount: count,
      windowSlot,
    };
  } catch (error) {
    console.warn(
      "[RateLimit] Web rate-limit Redis check failed; allowing request",
      error
    );
    return { allowed: true, retryAfterSeconds: waitSeconds, windowSlot };
  }
}
