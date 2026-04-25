"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, X, Send, Loader2, Bot, User, MapPin } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "What's a fair price for direct cremation?",
  "Do I have to pay for embalming?",
  "What's the cheapest option near me?",
  "Can I bring my own casket?",
];

// Very lightweight markdown: **bold**, *italic*, bullet lists, line breaks
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet point
    if (/^[•\-\*]\s/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-1.5 my-0.5">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
          <span>{inlineMarkdown(line.replace(/^[•\-\*]\s/, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<div key={i}>{inlineMarkdown(line)}</div>);
    }
  }
  return <>{elements}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  // Split on **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export default function ChatBot({ location: propLocation }: { location?: string }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(propLocation || "");
  const [editingLocation, setEditingLocation] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello. I'm here to help you understand funeral pricing and your rights.\n\nYou can ask me things like:\n• What's a fair price for direct cremation?\n• What services can I decline?\n• Do I have to pay for embalming?\n\nSet your city or ZIP above to see local prices.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          location: location || undefined,
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

  const showQuickPrompts = messages.length <= 2 && !loading;

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
        <div className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[370px] flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden">

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

          {/* Location bar */}
          <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
            {editingLocation ? (
              <input
                autoFocus
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => setEditingLocation(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingLocation(false)}
                placeholder="City or ZIP code"
                className="flex-1 bg-transparent text-xs text-stone-700 outline-none placeholder:text-stone-400"
              />
            ) : (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex-1 text-left text-xs text-stone-500 hover:text-stone-800"
              >
                {location || "Set your city or ZIP for local prices"}
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    m.role === "assistant" ? "bg-stone-800 text-white" : "bg-emerald-700 text-white"
                  )}
                >
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "bg-white text-stone-800 shadow-sm ring-1 ring-black/5"
                      : "bg-stone-800 text-white"
                  )}
                >
                  {m.content ? (
                    renderMarkdown(m.content)
                  ) : loading && i === messages.length - 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                  ) : null}
                </div>
              </div>
            ))}

            {/* Quick prompts shown after greeting */}
            {showQuickPrompts && (
              <div className="flex flex-col gap-1.5 pl-9">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors shadow-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-stone-200 p-3 bg-white">
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about pricing or your rights…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800 text-white transition-colors hover:bg-stone-700 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
