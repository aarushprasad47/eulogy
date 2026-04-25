"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, MapPin, Flower2 } from "lucide-react";

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

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (/^[•\-\*]\s/.test(line)) {
      return (
        <div key={i} className="flex gap-2 my-0.5">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
          <span>{inlineMd(line.replace(/^[•\-\*]\s/, ""))}</span>
        </div>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <div key={i}>{inlineMd(line)}</div>;
  });
}

function inlineMd(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
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
        "Hello. I'm here to help your family understand funeral pricing and your rights.\n\n• What city or ZIP code are you searching in?\n• Ask me about specific services\n• I can explain what you're legally entitled to",
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
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
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
          content: "Sorry, I had trouble connecting. Please try again in a moment.",
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
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-white shadow-xl transition-all hover:shadow-2xl hover:-translate-y-0.5 animate-fade-up"
          style={{ background: "var(--amber)", animationDelay: "0.8s" }}
        >
          <Flower2 className="h-4 w-4" />
          <span className="text-sm font-medium">Ask Eulogy</span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 flex h-[580px] w-[375px] flex-col rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
          style={{ background: "white", border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ background: "var(--brown)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Flower2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Eulogy Assistant</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Funeral pricing guide
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Location bar */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--paper)",
            }}
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--muted)" }} />
            {editingLocation ? (
              <input
                autoFocus
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => setEditingLocation(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingLocation(false)}
                placeholder="City or ZIP code"
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "var(--brown)" }}
              />
            ) : (
              <button
                onClick={() => setEditingLocation(true)}
                className="flex-1 text-left text-xs transition-colors"
                style={{ color: location ? "var(--brown)" : "var(--muted)" }}
              >
                {location || "Set your city or ZIP for local prices →"}
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ background: "var(--cream)" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className="flex gap-2.5 animate-fade-up"
                style={{
                  flexDirection: m.role === "user" ? "row-reverse" : "row",
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: m.role === "assistant" ? "var(--brown)" : "var(--amber)",
                  }}
                >
                  {m.role === "assistant"
                    ? <Bot className="h-3.5 w-3.5 text-white" />
                    : <User className="h-3.5 w-3.5 text-white" />
                  }
                </div>
                <div
                  className="max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: m.role === "assistant" ? "white" : "var(--brown)",
                    color: m.role === "assistant" ? "var(--brown)" : "white",
                    boxShadow: m.role === "assistant" ? "0 1px 4px rgba(28,16,8,0.06)" : undefined,
                  }}
                >
                  {m.content ? (
                    renderMarkdown(m.content)
                  ) : loading && i === messages.length - 1 ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--muted)" }} />
                  ) : null}
                </div>
              </div>
            ))}

            {showQuickPrompts && (
              <div className="flex flex-col gap-1.5 pl-9 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-left rounded-xl px-3 py-2 text-xs transition-all hover:-translate-y-0.5 hover:shadow-sm"
                    style={{
                      background: "white",
                      border: "1px solid var(--border)",
                      color: "var(--taupe)",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="p-3"
            style={{
              borderTop: "1px solid var(--border)",
              background: "white",
            }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: "var(--paper)", border: "1px solid var(--border)" }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask about pricing or your rights…"
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "var(--brown)" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-30"
                style={{ background: "var(--amber)" }}
              >
                {loading
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Send className="h-3 w-3" />
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
