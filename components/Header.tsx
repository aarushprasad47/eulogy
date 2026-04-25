"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flower2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const path = usePathname();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(254,252,248,0.88)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ color: "var(--brown)" }}
        >
          <Flower2 className="h-5 w-5" style={{ color: "var(--amber)" }} />
          <span
            className="text-lg tracking-tight"
            style={{ fontFamily: "Lora, Georgia, serif", fontWeight: 600 }}
          >
            Eulogy
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {[
            { href: "/compare", label: "Compare" },
            { href: "/chat",    label: "Ask AI" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                path === href
                  ? "bg-white text-[var(--brown)] shadow-sm"
                  : "text-[var(--taupe)] hover:text-[var(--brown)] hover:bg-white/60"
              )}
            >
              {label}
            </Link>
          ))}

          <Link
            href="/register"
            className="ml-2 rounded-full px-4 py-1.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
            style={{ background: "var(--amber)" }}
          >
            List Your Home
          </Link>
        </nav>
      </div>
    </header>
  );
}
