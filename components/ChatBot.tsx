"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  location?: string;
}

export default function ChatBot({ location }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I'm here to help you understand funeral pricing and your rights. You can ask me things like:\n\n• \"What's a fair price for direct cremation?\"\n• \"What services can I decline?\"\n• \"Show me the cheapest options near me\"\n• \"Do I have to pay for embalming?\"\n\nWhat can I help you with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          location,
        }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: accumulated };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-stone-800 px-5 py-3 text-white shadow-xl transition-all hover:bg-stone-700",
          open && "hidden"
        )}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Ask Eulogy</span>
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[360px] flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-stone-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-stone-200" />
              <div>
                <p className="text-sm font-semibold text-white">Eulogy Assistant</p>
                <p className="text-xs text-stone-400">Funeral pricing guide</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
                    m.role === "assistant"
                      ? "bg-stone-800 text-white"
                      : "bg-sage-600 bg-emerald-700 text-white"
                  )}
                >
                  {m.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "assistant"
                      ? "bg-white text-stone-800 shadow-sm ring-1 ring-black/5"
                      : "bg-stone-800 text-white"
                  )}
                >
                  {m.content || (loading && i === messages.length - 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                  ) : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 p-3 bg-white">
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about pricing or your rights..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
