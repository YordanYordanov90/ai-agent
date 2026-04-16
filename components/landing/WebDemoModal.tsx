"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDiscordInstallUrl } from "@/lib/discord";

const DEMO_SUGGESTIONS = [
  "Analyze AAPL stock right now",
  "Write a Next.js auth page with rate limiting + create Draft PR",
  "Draft 5 LinkedIn posts for a new SaaS launch",
  "Run a full project security & performance scan",
  "Explain how to use Cody in my Discord server",
] as const;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

type WebDemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WebDemoModal({ isOpen, onClose }: WebDemoModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const discordInstallUrl = getDiscordInstallUrl(
    process.env.NEXT_PUBLIC_DISCORD_APPLICATION_ID ?? ""
  );
  const signInAndConnectHref = `/sign-in?redirect_url=${encodeURIComponent(discordInstallUrl)}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming, isOpen]);

  const canSend = useMemo(() => input.trim().length > 0 && !isStreaming, [input, isStreaming]);
  const userMessageCount = useMemo(
    () => messages.filter((message) => message.role === "user").length,
    [messages]
  );
  const assistantMessageCount = useMemo(
    () => messages.filter((message) => message.role === "assistant").length,
    [messages]
  );
  const showConversionBanner = userMessageCount >= 3 || assistantMessageCount >= 3;

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMessage];
    const assistantId = `${Date.now()}-assistant`;
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          userId: "web-demo-user",
          channelId: "web-demo",
          mode: "demo",
        }),
      });

      if (!response.ok) {
        let fallbackError = "Request failed";
        try {
          const data = (await response.json()) as { error?: string };
          fallbackError = data.error ?? fallbackError;
        } catch {
          // Keep fallback text.
        }
        throw new Error(fallbackError);
      }

      if (!response.body) {
        throw new Error("No response stream returned.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamedText += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? { ...message, content: streamedText } : message
          )
        );
      }

      streamedText += decoder.decode();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: streamedText || "No response returned." }
            : message
        )
      );
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unexpected error";
      setError(message);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async () => {
    await sendPrompt(input);
  };

  const handleSuggestionClick = async (prompt: string) => {
    setInput(prompt);
    await sendPrompt(prompt);
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-fade-up flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border border-zinc-800 border-t-emerald-500/50 bg-black/90 backdrop-blur-xl shadow-[0_0_0_1px_rgba(63,63,70,0.6),0_0_35px_rgba(16,185,129,0.08)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-dialog-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Web Demo</p>
            <div className="flex items-center gap-3">
              <h3 id="demo-dialog-title" className="font-heading text-xl uppercase text-white">
                Live Cody Chat
              </h3>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse bg-emerald-400" />
                System Online
              </span>
            </div>
            <Badge variant="secondary">Demo mode - responses are read-only</Badge>
          </div>
          <div className="flex items-center gap-2">
            {showConversionBanner ? (
              <>
                <span className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  Demo limit reached
                </span>
                <Button asChild size="sm" className="bg-emerald-500 text-black hover:bg-emerald-400">
                  <Link href={signInAndConnectHref}>Connect Cody</Link>
                </Button>
              </>
            ) : null}
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close web demo">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto border-b border-zinc-800 p-5 [scrollbar-width:thin] [scrollbar-color:rgba(16,185,129,0.35)_rgba(0,0,0,0)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-emerald-500/30 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {messages.length === 0 ? (
            <p className="font-mono text-sm text-zinc-500">
              Start by asking Cody anything.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[90%] animate-fade-up border px-3 py-2 font-mono text-sm ${
                    message.role === "user"
                      ? "ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                      : "border-l-2 border-l-zinc-500 border-zinc-700 bg-zinc-900/85 text-zinc-100 shadow-[0_0_0_1px_rgba(39,39,42,0.7)]"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    {message.role === "assistant" ? "cody" : "you"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
              {isStreaming ? (
                <div className="inline-flex animate-fade-up items-center gap-2 border border-zinc-700 bg-zinc-900/90 px-3 py-2 font-mono text-xs uppercase tracking-widest text-zinc-400">
                  <span className="h-3.5 w-2 animate-pulse bg-emerald-400/90" />
                  Cody is typing...
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-3 p-5">
          {error ? <p className="font-mono text-xs text-red-400">Error: {error}</p> : null}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                className="h-auto justify-start whitespace-normal border-zinc-700 bg-zinc-950/70 py-3 text-left text-xs font-mono text-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                onClick={() => void handleSuggestionClick(suggestion)}
                disabled={isStreaming}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          <textarea
            id="web-demo-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask Cody..."
            aria-label="Message to Cody"
            className="h-24 w-full resize-none border border-zinc-700 bg-zinc-950/85 p-3 font-mono text-sm text-zinc-100 outline-none transition focus:border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSend} disabled={!canSend}>
              {isStreaming ? "Streaming..." : "Send to /api/agent"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
