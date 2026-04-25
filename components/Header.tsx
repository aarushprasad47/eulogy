"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";

function DoveLogo() {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 9C10.5 6.5 6.5 5.5 4 7.5C1.5 9.5 2 13 5 14.5C7.5 15.8 10.5 14.5 13 12C15.5 14.5 18.5 15.8 21 14.5C24 13 24.5 9.5 22 7.5C19.5 5.5 15.5 6.5 13 9Z" opacity="0.85"/>
      <path d="M13 9C13 6 16 3.5 19.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M5.5 14.5L3 18M8 15.5L6.5 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  );
}

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
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-70"
          style={{ color: "var(--navy)" }}
        >
          <DoveLogo />
          <div>
            <span
              className="block text-xl leading-none tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700 }}
            >
              eulogy
            </span>
            <span
              className="block text-[9px] tracking-[0.18em] uppercase"
              style={{ color: "var(--taupe)", letterSpacing: "0.18em" }}
            >
              Funeral Services
            </span>
          </div>
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
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--navy)" }}
        >
          <Phone className="h-3.5 w-3.5" />
          Get In Touch
        </Link>
      </div>
    </header>
  );
}
