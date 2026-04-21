import { after } from "next/server";
import { getDiscordChat } from "@/lib/discord-chat";
import { verifyQstashSignature } from "@/lib/qstash";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const GATEWAY_LISTENER_DURATION_MS = (maxDuration - 10) * 1000;

const resolveWebhookUrl = (): string => {
  const hostSource = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (!hostSource) {
    throw new Error("VERCEL_URL not configured");
  }

  const host = hostSource.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `https://${host}/api/discord`;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const signature = request.headers.get("upstash-signature");
    const rawBody = await request.text();
    const verified = await verifyQstashSignature({
      signature,
      body: rawBody,
    });
    if (!verified) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chat = getDiscordChat();
    await chat.initialize();
    const discordAdapter = chat.getAdapter("discord");
    return discordAdapter.startGatewayListener(
      { waitUntil: (task: Promise<unknown>) => after(() => task) },
      GATEWAY_LISTENER_DURATION_MS,
      undefined,
      resolveWebhookUrl()
    );
  } catch (error) {
    console.error("[Discord Gateway Keepalive] Worker error", error);
    return Response.json({ error: "Failed to process keepalive request" }, { status: 500 });
  }
}

export async function GET(): Promise<Response> {
  return new Response("Use QStash signed POST for this endpoint.", { status: 405 });
}
