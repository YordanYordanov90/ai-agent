"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentResponse = {
  text?: string;
  error?: string;
};

type WebDemoModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function WebDemoModal({ isOpen, onClose }: WebDemoModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          userId: "web-demo-user",
          channelId: "web-demo",
        }),
      });

      const data = (await response.json()) as AgentResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      const assistantText = typeof data.text === "string" ? data.text : "No response returned.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : "Unexpected error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-3xl border border-zinc-800 bg-black shadow-[0_0_0_1px_rgba(63,63,70,0.6)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Init Web Demo"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">Web Demo</p>
            <h3 className="font-heading text-xl uppercase text-white">Test Agent API</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close web demo">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="h-[360px] overflow-y-auto border-b border-zinc-800 p-5">
          {messages.length === 0 ? (
            <p className="font-mono text-sm text-zinc-500">
              Start by asking Cody anything. This sends requests to <span className="text-zinc-300">/api/agent</span>.
            </p>
          ) : (
            <div className="space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] border px-3 py-2 font-mono text-sm ${
                    message.role === "user"
                      ? "ml-auto border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border-zinc-700 bg-zinc-900 text-zinc-100"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-400">{message.role}</p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
              {isLoading ? (
                <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Cody is thinking...</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="space-y-3 p-5">
          {error ? <p className="font-mono text-xs text-red-400">Error: {error}</p> : null}
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Cody..."
            className="h-24 w-full resize-none border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 outline-none focus:border-emerald-500"
          />
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleSend} disabled={!canSend}>
              {isLoading ? "Sending..." : "Send to /api/agent"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
