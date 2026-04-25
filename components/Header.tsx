"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import Image from "next/image";

const NAV = [
  { href: "/compare",  label: "Compare" },
  { href: "/explore",  label: "Explore" },
  { href: "/register", label: "List a Home" },
];

export default function Header() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-40" style={{ background: "transparent" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">

        {/* Logo — large */}
        <Link href="/" className="transition-opacity hover:opacity-75">
          <Image
            src="/logo.png"
            alt="Eulogy Funeral Services"
            width={320}
            height={118}
            className="h-28 w-auto"
            priority
          />
        </Link>

        {/* Nav links — free-floating, no background */}
        <nav className="hidden md:flex items-center gap-10">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm transition-opacity hover:opacity-60"
              style={{
                color: "var(--navy)",
                fontWeight: path === href ? 600 : 400,
                opacity: path === href ? 1 : 0.75,
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA pill */}
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
