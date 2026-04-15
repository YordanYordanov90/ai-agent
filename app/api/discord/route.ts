// app/api/discord/route.ts
import { NextRequest } from "next/server";
import { chat } from "@/lib/discord-chat";
import { publishQstashJob } from "@/lib/qstash";

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

  const userId =
    readStringProp(message, "authorId") ??
    readStringProp(message, "userId") ??
    "discord-user";
  const channelId = readStringProp(thread, "id") ?? "discord";
  const messageId = readStringProp(message, "id") ?? crypto.randomUUID();

  await publishQstashJob({
    type: "agent",
    text,
    userId,
    channelId,
    messageId,
  });

  await thread.post("Processing your request. I will reply in a moment.");
});

chat.onNewMention(async (thread, message) => {
  const text = message.text?.trim();
  if (!text) {
    await thread.post("Please provide a message.");
    return;
  }

  const userId =
    readStringProp(message, "authorId") ??
    readStringProp(message, "userId") ??
    "discord-user";
  const channelId = readStringProp(thread, "id") ?? "discord";
  const messageId = readStringProp(message, "id") ?? crypto.randomUUID();

  await publishQstashJob({
    type: "agent",
    text,
    userId,
    channelId,
    messageId,
  });

  await thread.post("Processing your request. I will reply in a moment.");
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