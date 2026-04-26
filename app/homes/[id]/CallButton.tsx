"use client";

import { useState } from "react";
import { Phone, Loader2, CheckCircle } from "lucide-react";

interface Props {
  homeId: string;
  phone: string;
  homeName: string;
}

export default function CallButton({ homeId, phone, homeName }: Props) {
  const [status, setStatus] = useState<"idle" | "calling" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function initiateCall() {
    setStatus("calling");
    setMessage("");
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, funeralHomeName: homeName, funeralHomeId: homeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Call failed");
      setStatus("done");
      setMessage(`Call initiated (${data.callSid?.slice(0, 12)}…)`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Call failed");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={initiateCall}
        disabled={status === "calling" || status === "done"}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
        style={{ background: "#F0FDF4", color: "#16A34A" }}
      >
        {status === "calling" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === "done" ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : (
          <Phone className="h-3.5 w-3.5" />
        )}
        {status === "calling" ? "Calling…" : status === "done" ? "Called" : "Call for GPL"}
      </button>
      {message && (
        <p className="text-xs px-1" style={{ color: status === "error" ? "#DC2626" : "var(--muted)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
