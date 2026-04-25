"use client";

import { useState } from "react";
import { Loader2, Globe } from "lucide-react";

export default function ScraperButton({ homeId, website }: { homeId: string; website: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  async function run() {
    setStatus("loading");
    try {
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website, funeralHomeId: homeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCount(data.scraped?.services?.length ?? 0);
        setStatus("done");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={run}
      disabled={status === "loading"}
      className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
    >
      {status === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Globe className="h-3 w-3" />
      )}
      {status === "done"
        ? `Scraped ${count} prices`
        : status === "error"
        ? "Scrape failed"
        : "Scrape website"}
    </button>
  );
}
