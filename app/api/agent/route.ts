// app/api/agent/route.ts
import { NextRequest } from "next/server";
import { createCodyAgent } from "@/lib/agent";
import { checkWebAgentRateLimit } from "@/lib/rate-limit";
import { getWebDemoRoutingLabels } from "@/lib/web-demo-routing";
import { createRedactedTextStream } from "@/lib/stream-redaction";
import { z } from "zod";

const DEMO_MAX_USER_MESSAGES = 3;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12_000),
});

const RequestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

function isOriginAllowed(origin: string): boolean {
  const allowedStr = process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  if (!allowedStr) return false;
  const allowed = allowedStr.split(",").map((o) => o.trim().toLowerCase());
  return allowed.some((a) => origin.toLowerCase() === a);
}

function getCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  if (!isOriginAllowed(origin)) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") ?? null;
  if (origin && !isOriginAllowed(origin)) {
    return new Response("Origin not allowed.", { status: 403 });
  }
  const corsHeaders = origin ? getCorsHeaders(origin) : {};

  try {
    const clientIp = getClientIp(req);
    const rl = await checkWebAgentRateLimit(clientIp);
      if (!rl.allowed) {
        return Response.json(
          { error: "Too many requests. Please wait before trying again." },
          {
            status: 429,
            headers: { 
              "Retry-After": String(rl.retryAfterSeconds),
              ...corsHeaders 
            },
          }
        );
      }

      const { userId, channelId } = getWebDemoRoutingLabels(clientIp);

    const rawBody = await req.json();

    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.error("[Agent API] Request payload validation failed", parsed.error);
      if (process.env.NODE_ENV === "production") {
        return Response.json({ error: "Invalid request payload" }, { 
          status: 400,
          headers: corsHeaders 
        });
      }
      return Response.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }
    const { messages } = parsed.data;
    const userMessageCount = messages.filter((message) => message.role === "user").length;
    if (userMessageCount > DEMO_MAX_USER_MESSAGES) {
      return Response.json(
        {
          error:
            "Demo message limit reached. Please sign in and connect Cody to continue.",
        },
        { 
          status: 429,
          headers: corsHeaders 
        }
      );
    }

    const result = await createCodyAgent({
      messages,
      userId,
      channelId,
      demoMode: true,
    });

    const textStream = result.textStream;
    const redactedStream = createRedactedTextStream(textStream);
    return new Response(redactedStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[Agent API] Error:", error);
    return Response.json(
      { error: "Failed to process request" },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}
