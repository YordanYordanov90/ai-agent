// app/api/discord/route.ts
import { NextRequest } from "next/server";
import { createCodyAgent } from "@/lib/agent";
import { chat } from "@/lib/discord-chat";

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

  const responseText = await createCodyAgent({
    messages: [{ role: "user", content: text }],
    userId: readStringProp(message, "authorId") ?? readStringProp(message, "userId") ?? "discord-user",
    channelId: readStringProp(thread, "id") ?? "discord",
  });
  await thread.post(responseText.text);
});

chat.onNewMention(async (thread, message) => {
  const text = message.text?.trim();
  if (!text) {
    await thread.post("Please provide a message.");
    return;
  }

  const responseText = await createCodyAgent({
    messages: [{ role: "user", content: text }],
    userId: readStringProp(message, "authorId") ?? readStringProp(message, "userId") ?? "discord-user",
    channelId: readStringProp(thread, "id") ?? "discord",
  });
  await thread.post(responseText.text);
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