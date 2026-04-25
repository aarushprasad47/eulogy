"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What's a fair price for direct cremation?",
  "Can I decline embalming?",
  "What is the FTC Funeral Rule?",
  "Show me the cheapest options",
  "Do I have to buy a casket from the funeral home?",
  "What services am I legally required to pay for?",
];

export default function ChatPage() {
  const [location, setLocation] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I'm the Eulogy pricing assistant — here to help your family understand funeral costs and your legal rights.\n\nYou can ask me about:\n• Fair prices for specific services\n• Your rights under the FTC Funeral Rule\n• Comparing options in your area\n• What services you can skip\n\nWhat city or ZIP are you in? That helps me show you local pricing data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
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

      if (!res.body) throw new Error("No response");

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
          content: "I'm having trouble responding right now. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-3xl flex-col px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flower2 className="h-5 w-5 text-stone-600" />
          <h1 className="font-semibold text-stone-900">Eulogy AI Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">Your location:</label>
          <input
            type="text"
            placeholder="City or ZIP"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-36 rounded-lg border border-stone-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm",
                m.role === "assistant" ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-700"
              )}
            >
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "assistant"
                  ? "bg-stone-50 text-stone-800 ring-1 ring-stone-200"
                  : "bg-stone-800 text-white"
              )}
            >
              {m.content || (
                loading && i === messages.length - 1
                  ? <span className="flex items-center gap-1 text-stone-400"><Loader2 className="h-3 w-3 animate-spin" /> Thinking...</span>
                  : null
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-50 hover:border-stone-300"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-3 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about funeral pricing, your rights, local options..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
