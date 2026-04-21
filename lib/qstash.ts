import { Client, Receiver } from "@upstash/qstash";
import { z } from "zod";

const normalizeHost = (host: string) => host.replace(/^https?:\/\//, "").replace(/\/+$/, "");

/** Discord API snowflake (numeric id); matches `lib/discord-target-channel.ts` conventions. */
const discordSnowflake = z.string().regex(/^\d{5,32}$/u);

/**
 * Dedupe key: real Discord message ids are snowflakes; the webhook path may use a UUID when id is missing.
 */
const qstashMessageId = z.union([discordSnowflake, z.string().uuid()]);

export const qstashJobSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("agent"),
    text: z.string().min(1),
    userId: z.string().min(1).max(256),
    channelId: discordSnowflake,
    messageId: qstashMessageId,
  }),
  z.object({
    type: z.literal("keepalive"),
    messageId: z.string().min(1).optional(),
    userId: z.string().min(1).optional(),
    channelId: z.string().min(1).optional(),
    text: z.string().optional(),
  }),
]);

export type QstashJob = z.infer<typeof qstashJobSchema>;
type AgentQstashJob = Extract<QstashJob, { type: "agent" }>;

const getClient = () => new Client({ token: process.env.QSTASH_TOKEN });

const buildDefaultEndpoint = (path: string): string => {
  const hostSource =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!hostSource) {
    throw new Error("No worker endpoint configured. Set VERCEL_URL.");
  }

  return `https://${normalizeHost(hostSource)}${path}`;
};

export const getAgentWorkerEndpoint = (): string => {
  if (process.env.DISCORD_WORKER_ENDPOINT) {
    return process.env.DISCORD_WORKER_ENDPOINT;
  }

  return buildDefaultEndpoint("/api/discord/gateway/agent");
};

export const getKeepaliveEndpoint = (): string =>
  buildDefaultEndpoint("/api/discord/gateway/keepalive");

export const publishQstashJob = async (job: AgentQstashJob) => {
  const client = getClient();
  const url = getAgentWorkerEndpoint();

  return client.publishJSON({
    url,
    body: job,
    retries: 3,
    ...(job.messageId ? { deduplicationId: job.messageId } : {}),
  });
};

export const verifyQstashSignature = async ({
  signature,
  body,
  url,
}: {
  signature: string | null;
  body: string;
  url?: string;
}): Promise<boolean> => {
  if (!signature) return false;
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    return false;
  }

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
  });

  try {
    await receiver.verify({ signature, body, url });
    return true;
  } catch {
    return false;
  }
};

