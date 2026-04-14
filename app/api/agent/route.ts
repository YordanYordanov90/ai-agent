// app/api/agent/route.ts
import { NextRequest } from "next/server";
import { createCodyAgent } from "@/lib/agent";
import { z } from "zod";

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
    })
  ),
  userId: z.string().optional(),
  channelId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
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