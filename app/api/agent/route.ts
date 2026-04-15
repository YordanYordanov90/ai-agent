// app/api/agent/route.ts
import { NextRequest } from "next/server";
import { sanitizeRoutingLabel } from "@/lib/agent-context";
import { createCodyAgent } from "@/lib/agent";
import { z } from "zod";

const ROUTING_MAX = 256;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12_000),
});

const RequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
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
    const { messages, userId, channelId } = parsed.data;

    const result = await createCodyAgent({
      messages,
      userId: userId || "web-user",
      channelId: channelId || "web",
    });

    return Response.json({
      text: result.text,
    });
  } catch (error) {
    console.error("[Agent API] Error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}