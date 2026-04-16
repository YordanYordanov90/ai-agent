// app/api/agent/route.ts
import { NextRequest } from "next/server";
import { sanitizeRoutingLabel } from "@/lib/agent-context";
import { createCodyAgent } from "@/lib/agent";
import { z } from "zod";

const ROUTING_MAX = 256;
const DEMO_MAX_USER_MESSAGES = 3;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12_000),
});

const RequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  mode: z.enum(["default", "demo"]).optional(),
  demoMode: z.boolean().optional(),
  userId: z
    .string()
    .max(ROUTING_MAX)
    .optional()
    .transform((s) => (s === undefined ? undefined : sanitizeRoutingLabel(s, ROUTING_MAX))),
  channelId: z
    .string()
    .max(ROUTING_MAX)
    .optional()
    .transform((s) => (s === undefined ? undefined : sanitizeRoutingLabel(s, ROUTING_MAX))),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.error("[Agent API] Request payload validation failed", parsed.error);
      if (process.env.NODE_ENV === "production") {
        return Response.json({ error: "Invalid request payload" }, { status: 400 });
      }
      return Response.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { messages, userId, channelId, mode, demoMode } = parsed.data;
    const resolvedUserId = userId || "web-user";
    const resolvedChannelId = channelId || "web";
    const isDemoMode =
      mode === "demo" ||
      demoMode === true ||
      resolvedUserId.startsWith("web-demo") ||
      resolvedChannelId.startsWith("web-demo");
    const userMessageCount = messages.filter((message) => message.role === "user").length;
    if (isDemoMode && userMessageCount > DEMO_MAX_USER_MESSAGES) {
      return Response.json(
        {
          error:
            "Demo message limit reached. Please sign in and connect Cody to continue.",
        },
        { status: 429 }
      );
    }

    const result = await createCodyAgent({
      messages,
      userId: resolvedUserId,
      channelId: resolvedChannelId,
      demoMode: isDemoMode,
    });

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("[Agent API] Error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}