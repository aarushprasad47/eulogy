"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import Image from "next/image";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <Link href="/" className="transition-opacity hover:opacity-75">
          <Image
            src="/logo.png"
            alt="Eulogy Funeral Services"
            width={220}
            height={80}
            className="h-20 w-auto"
            priority
          />
        </Link>

        <Link
          href="/chat"
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "var(--navy)" }}
        >
          <Phone className="h-3.5 w-3.5" />
          Get In Touch
        </Link>
      </div>
    </header>
  );
}
