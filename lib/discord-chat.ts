import { Chat } from "chat";
import { DiscordAdapter } from "@chat-adapter/discord";
import { createMemoryStateAdapter, createRedisStateAdapter } from "@/lib/discord-chat-state";
import { getRedis } from "@/lib/redis";
import type { StateAdapter } from "chat";

const MEMORY_WARN_KEY = "__codyDiscordChatMemoryWarned";

type DiscordChatGlobals = typeof globalThis & {
  __codyDiscordState?: StateAdapter;
  __codyDiscordChat?: CodyChat;
};

const createDiscordChat = () =>
  new Chat({
    userName: "cody",
    state: getDiscordState(),
    adapters: {
      discord: new DiscordAdapter({
        botToken: process.env.DISCORD_BOT_TOKEN,
        publicKey: process.env.DISCORD_PUBLIC_KEY,
        applicationId: process.env.DISCORD_APPLICATION_ID,
      }),
    },
  });

type CodyChat = ReturnType<typeof createDiscordChat>;

const warnMissingRedisOnce = () => {
  if (!(Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production")) return;
  const g = globalThis as typeof globalThis & Record<string, boolean | undefined>;
  if (!g[MEMORY_WARN_KEY]) {
    g[MEMORY_WARN_KEY] = true;
    console.warn(
      "[discord-chat] Redis env not configured — Chat SDK state is in-memory only and is not shared across serverless instances. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for reliable production Discord behavior."
    );
  }
};

export const getDiscordState = (): StateAdapter => {
  const g = globalThis as DiscordChatGlobals;
  if (!g.__codyDiscordState) {
    try {
      const redis = getRedis();
      if (redis !== null) {
        g.__codyDiscordState = createRedisStateAdapter(redis);
      } else {
        warnMissingRedisOnce();
        g.__codyDiscordState = createMemoryStateAdapter();
      }
    } catch (error) {
      console.error("[discord-chat] Failed initializing state adapter", error);
      g.__codyDiscordState = createMemoryStateAdapter();
    }
  }
  return g.__codyDiscordState;
};

export const getDiscordChat = (): CodyChat => {
  const g = globalThis as DiscordChatGlobals;
  if (!g.__codyDiscordChat) {
    try {
      g.__codyDiscordChat = createDiscordChat();
    } catch (error) {
      console.error("[discord-chat] Failed initializing Chat instance", error);
      throw error;
    }
  }
  return g.__codyDiscordChat;
};
