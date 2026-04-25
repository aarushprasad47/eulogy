"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export default function EmailBotButton({ homeId, email }: { homeId: string; email: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "exists" | "error">("idle");

  async function send() {
    setStatus("loading");
    try {
      const res = await fetch("/api/email-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ funeralHomeId: homeId }),
      });
      if (res.status === 409) {
        setStatus("exists");
      } else if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const labels = {
    idle: "Request GPL",
    loading: "Sending...",
    sent: "GPL request sent!",
    exists: "Already requested",
    error: "Send failed",
  };

  return (
    <button
      onClick={send}
      disabled={status !== "idle"}
      className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-60"
    >
      {status === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Mail className="h-3 w-3" />
      )}
      {labels[status]}
    </button>
  );
}
