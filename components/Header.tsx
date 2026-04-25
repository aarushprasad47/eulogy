"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import Image from "next/image";

const NAV = [
  { href: "/compare",  label: "Compare" },
  { href: "/register", label: "List a Home" },
];

export default function Header() {
  const path = usePathname();

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(255,255,255,0.90)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">

        {/* Logo image */}
        <Link href="/" className="transition-opacity hover:opacity-75">
          <Image
            src="/logo.png"
            alt="Eulogy Funeral Services"
            width={160}
            height={58}
            className="h-14 w-auto"
            priority
          />
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-colors"
              style={{
                color: path === href ? "var(--navy)" : "var(--taupe)",
                fontWeight: path === href ? 600 : 400,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
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
