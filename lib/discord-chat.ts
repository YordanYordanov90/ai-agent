import { Chat } from "chat";
import { DiscordAdapter } from "@chat-adapter/discord";
import { createMemoryStateAdapter, createRedisStateAdapter } from "@/lib/discord-chat-state";
import { getRedis } from "@/lib/redis";

const MEMORY_WARN_KEY = "__codyDiscordChatMemoryWarned";

const redis = getRedis();
export const state =
  redis !== null ? createRedisStateAdapter(redis) : createMemoryStateAdapter();

if (redis === null && (Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production")) {
  const g = globalThis as typeof globalThis & Record<string, boolean | undefined>;
  if (!g[MEMORY_WARN_KEY]) {
    g[MEMORY_WARN_KEY] = true;
    console.warn(
      "[discord-chat] Redis env not configured — Chat SDK state is in-memory only and is not shared across serverless instances. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for reliable production Discord behavior."
    );
  }
}

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
