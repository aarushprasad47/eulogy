"use client";

import { MessageCircle } from "lucide-react";

export default function ChatOpenButton({ small }: { small?: boolean }) {
  function open() {
    window.dispatchEvent(new CustomEvent("eulogy:open-chat"));
  }

  if (small) {
    return (
      <button
        onClick={open}
        className="mt-2 text-sm font-semibold transition-opacity hover:opacity-70"
        style={{ color: "var(--navy)" }}
      >
        Chat with Eulogy →
      </button>
    );
  }

  return (
    <button
      onClick={open}
      className="flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ background: "var(--navy)" }}
    >
      <MessageCircle className="h-4 w-4" />
      Chat with Eulogy to get started
    </button>
  );
}
