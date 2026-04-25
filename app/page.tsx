import Link from "next/link";
import Image from "next/image";
import {
  Search, Shield, Mail, Globe, Heart, Users,
  ChevronRight, Calendar, GitCompare, Phone,
} from "lucide-react";
import SearchResults from "./SearchResults";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--cream)" }}
      >
        {/* Flower bouquet as hero background — softly fades at edges */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ zIndex: 0 }}
        >
          <Image
            src="/flower.png"
            alt=""
            fill
            className="object-cover object-center"
            style={{ opacity: 0.55 }}
            priority
          />
          {/* Radial vignette so edges blend into page bg */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 55%, transparent 30%, rgba(238,242,248,0.55) 60%, rgba(238,242,248,0.92) 85%, rgba(238,242,248,1) 100%)",
            }}
          />
        </div>

        {/* Content grid */}
        <div
          className="relative mx-auto max-w-7xl px-6 py-16"
          style={{ zIndex: 1 }}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px_300px] lg:items-start">

            {/* ── Left: text + search ─────────────────────── */}
            <div className="pt-4">
              <p
                className="animate-fade-up mb-5 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--taupe)", animationDelay: "0.05s" }}
              >
                Honoring Life. Celebrating Memories.
              </p>

              <h1
                className="animate-fade-up font-serif text-5xl font-bold leading-[1.12] sm:text-6xl"
                style={{ color: "var(--navy)", animationDelay: "0.12s" }}
              >
                <em style={{ fontStyle: "italic" }}>Compassionate</em> care
                <br />when it matters most.
              </h1>

              <p
                className="animate-fade-up mt-5 text-lg leading-relaxed"
                style={{ color: "var(--taupe)", animationDelay: "0.2s", maxWidth: "44ch" }}
              >
                At Eulogy, we help families honor their loved ones with dignity,
                respect, and transparent pricing that celebrates a life well lived.
              </p>

              {/* Search */}
              <form
                action="/"
                method="GET"
                className="animate-fade-up mt-8 flex gap-2"
                style={{ animationDelay: "0.27s" }}
              >
                <div className="relative flex-1">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: "var(--muted)" }}
                  />
                  <input
                    type="text"
                    name="q"
                    placeholder="City, ZIP, or funeral home name…"
                    className="w-full rounded-2xl py-3.5 pl-11 pr-4 text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.88)",
                      backdropFilter: "blur(8px)",
                      border: "1.5px solid var(--border)",
                      color: "var(--navy)",
                      boxShadow: "0 2px 8px rgba(45,74,107,0.07)",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--navy)" }}
                >
                  Search
                </button>
              </form>

              {/* CTA buttons */}
              <div
                className="animate-fade-up mt-5 flex flex-wrap gap-3"
                style={{ animationDelay: "0.34s" }}
              >
                <Link
                  href="/compare"
                  className="rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "var(--navy)" }}
                >
                  Our Services
                </Link>
                <Link
                  href="/compare"
                  className="rounded-full px-7 py-3 text-sm font-semibold transition-all hover:bg-white"
                  style={{
                    border: "1.5px solid rgba(45,74,107,0.35)",
                    color: "var(--navy)",
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Plan Ahead
                </Link>
              </div>
            </div>

            {/* ── Center: arch photo placeholder (flower bg does the job) ── */}
            {/* The arch shape focuses attention on the center bouquet */}
            <div className="hidden lg:block" aria-hidden="true">
              <div
                style={{
                  width: 380,
                  height: 500,
                  borderRadius: "190px 190px 0 0",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <Image
                  src="/flower.png"
                  alt="White flowers"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            {/* ── Right: floating info cards ──────────────── */}
            <div
              className="hidden lg:flex flex-col gap-4 animate-fade-up pt-8"
              style={{ animationDelay: "0.42s" }}
            >
              {/* Plan Ahead */}
              <div className="card p-5">
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "var(--icon-bg)" }}
                >
                  <Calendar className="h-5 w-5" style={{ color: "var(--navy)" }} />
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--navy)" }}>
                  Plan Ahead
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--taupe)" }}>
                  Plan your wishes in advance for peace of mind.
                </p>
                <Link
                  href="/compare"
                  className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-white/60"
                  style={{ border: "1.5px solid var(--border)", color: "var(--navy)" }}
                >
                  Learn More
                </Link>
              </div>

              {/* Need Immediate Help */}
              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--icon-bg)" }}
                  >
                    <Phone className="h-4.5 w-4.5" style={{ color: "var(--navy)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--navy)" }}>
                      Need Immediate Help?
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--taupe)" }}>
                      We&apos;re here 24/7 to support you and your family.
                    </p>
                    <p className="mt-2 text-sm font-semibold" style={{ color: "var(--navy)" }}>
                      Ask Eulogy →
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="px-6 pb-14 pt-10" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: Shield,
              title: "Personalized Services",
              desc: "Every life is unique. We create meaningful services that reflect your loved one&apos;s story.",
              delay: "0.05s",
            },
            {
              Icon: Heart,
              title: "Caring Support",
              desc: "Our compassionate team is here to guide you every step of the way.",
              delay: "0.10s",
            },
            {
              Icon: Users,
              title: "For Every Family",
              desc: "Services for all traditions, cultures, and beliefs.",
              delay: "0.15s",
            },
            {
              Icon: GitCompare,
              title: "Helpful Resources",
              desc: "Find guidance, checklists, and support when you need it most.",
              delay: "0.20s",
            },
          ].map(({ Icon, title, desc, delay }) => (
            <div key={title} className="card animate-fade-up p-5" style={{ animationDelay: delay }}>
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "var(--icon-bg)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--navy)" }} />
              </div>
              <h3 className="mb-2 font-semibold" style={{ color: "var(--navy)" }}>{title}</h3>
              <p
                className="mb-4 text-sm leading-relaxed"
                style={{ color: "var(--taupe)" }}
                dangerouslySetInnerHTML={{ __html: desc }}
              />
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full cursor-pointer"
                style={{ background: "var(--icon-bg)" }}
              >
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--navy)" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote — free-floating, not a full bar ─────────────────────── */}
      <section className="px-6 py-10" style={{ background: "var(--cream)" }}>
        <div
          className="mx-auto max-w-4xl animate-fade-up rounded-2xl px-10 py-8"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--border)",
            animationDelay: "0.1s",
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="font-serif text-5xl leading-none shrink-0"
              style={{ color: "var(--blue-pale)" }}
            >
              &ldquo;&ldquo;
            </span>
            <p
              className="font-serif flex-1 text-base"
              style={{ color: "var(--taupe)", lineHeight: "1.75", minWidth: "200px" }}
            >
              What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.
            </p>
            <p
              className="text-sm font-medium shrink-0"
              style={{ color: "var(--muted)" }}
            >
              — Helen Keller
            </p>
          </div>
        </div>
      </section>

      {/* ── How we collect data (3 methods) ──────────────────────────── */}
      <section className="px-6 pb-16 pt-4" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl grid gap-6 grid-cols-1 sm:grid-cols-3">
          {[
            {
              Icon: Shield,
              title: "Self-Reported",
              desc: "Funeral homes that voluntarily list their prices directly on Eulogy — the most accurate and up-to-date data.",
            },
            {
              Icon: Globe,
              title: "Web-Scraped",
              desc: "Our system automatically scans funeral home websites for publicly posted GPL pricing information.",
            },
            {
              Icon: Mail,
              title: "GPL Email Bot",
              desc: "We email funeral homes requesting their General Price List, as allowed by the FTC Funeral Rule.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.05s" }}>
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--icon-bg)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--navy)" }} />
              </div>
              <div>
                <p className="font-semibold" style={{ color: "var(--navy)" }}>{title}</p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Search results ─────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-4" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl">
          <SearchResults searchParams={searchParams} />
        </div>
      </section>

    </div>
  );
}
