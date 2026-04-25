import Link from "next/link";
import { Search, Shield, BookOpen, Heart, Users, ChevronRight, Calendar, GitCompare, Lock } from "lucide-react";
import SearchResults from "./SearchResults";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-8 pt-14" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_420px_300px] lg:items-center">

            {/* Left: text + search */}
            <div>
              <p
                className="animate-fade-up mb-5 text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--taupe)", animationDelay: "0.05s" }}
              >
                Honoring Life. Protecting Families.
              </p>
              <h1
                className="animate-fade-up font-serif text-5xl font-bold leading-[1.12] sm:text-6xl"
                style={{ color: "var(--navy)", animationDelay: "0.12s" }}
              >
                <em className="not-italic" style={{ fontStyle: "italic" }}>Compassionate</em>{" "}
                care when it matters most.
              </h1>
              <p
                className="animate-fade-up mt-5 text-lg leading-relaxed"
                style={{ color: "var(--taupe)", animationDelay: "0.2s", maxWidth: "46ch" }}
              >
                Eulogy helps families compare funeral prices with dignity, clarity, and
                zero pressure — because you deserve honest answers.
              </p>

              {/* Search bar */}
              <form
                action="/"
                method="GET"
                className="animate-fade-up mt-8 flex gap-2"
                style={{ animationDelay: "0.28s" }}
              >
                <div
                  className="relative flex-1"
                >
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
                      background: "white",
                      border: "1.5px solid var(--border)",
                      color: "var(--navy)",
                      boxShadow: "0 2px 8px rgba(45,74,107,0.06)",
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
                style={{ animationDelay: "0.35s" }}
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
                  className="rounded-full px-7 py-3 text-sm font-semibold transition-colors hover:bg-white"
                  style={{
                    border: "1.5px solid var(--border)",
                    color: "var(--navy)",
                    background: "rgba(255,255,255,0.6)",
                  }}
                >
                  Plan Ahead
                </Link>
              </div>
            </div>

            {/* Center: botanical illustration */}
            <div className="hidden lg:flex items-end justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="relative" style={{ width: 420, height: 480 }}>
                {/* Pale blue circle */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: "4%", left: "6%", right: "6%", bottom: "0%",
                    background: "radial-gradient(ellipse at 42% 38%, #D8E8F5 0%, #BACEDF 100%)",
                  }}
                />
                {/* Botanical SVG */}
                <svg
                  viewBox="0 0 300 430"
                  fill="none"
                  className="absolute inset-0 h-full w-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Stems */}
                  <path d="M118 428 C117 370 114 315 111 262 C108 209 113 158 127 92"
                    stroke="#A0B8CC" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M152 428 C152 362 155 302 161 246 C167 190 165 138 157 62"
                    stroke="#A0B8CC" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M185 428 C184 388 187 348 189 302 C191 256 185 202 173 128"
                    stroke="#A0B8CC" strokeWidth="1.5" strokeLinecap="round"/>

                  {/* Leaves */}
                  <path d="M118 255 C100 244 90 225 92 205 C110 212 119 232 118 255Z" fill="rgba(158,188,208,0.45)"/>
                  <path d="M126 295 C145 282 152 264 150 244 C134 252 126 272 126 295Z" fill="rgba(158,188,208,0.38)"/>
                  <path d="M185 300 C203 288 209 268 206 248 C190 258 184 276 185 300Z" fill="rgba(158,188,208,0.45)"/>
                  <path d="M161 342 C143 329 137 310 140 292 C155 301 162 320 161 342Z" fill="rgba(158,188,208,0.38)"/>

                  {/* Flower 1 — left stem */}
                  <g transform="translate(124,89) rotate(-12)">
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.88)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(51.4)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(102.8)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(154.2)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(205.6)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(257)"/>
                    <ellipse rx="8" ry="22" fill="rgba(255,255,255,0.78)" transform="rotate(308.6)"/>
                    <circle r="7" fill="rgba(255,255,255,0.96)"/>
                  </g>

                  {/* Flower 2 — center tallest */}
                  <g transform="translate(157,59)">
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.90)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(45)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(90)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(135)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(180)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(225)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(270)"/>
                    <ellipse rx="7" ry="19" fill="rgba(255,255,255,0.82)" transform="rotate(315)"/>
                    <circle r="6" fill="white"/>
                  </g>

                  {/* Flower 3 — right stem */}
                  <g transform="translate(176,124) rotate(8)">
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.88)"/>
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.78)" transform="rotate(60)"/>
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.78)" transform="rotate(120)"/>
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.78)" transform="rotate(180)"/>
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.78)" transform="rotate(240)"/>
                    <ellipse rx="7" ry="18" fill="rgba(255,255,255,0.78)" transform="rotate(300)"/>
                    <circle r="5.5" fill="rgba(255,255,255,0.95)"/>
                  </g>

                  {/* Small buds */}
                  <g transform="translate(110,166) rotate(-24)">
                    <ellipse rx="4.5" ry="12" fill="rgba(255,255,255,0.72)"/>
                    <ellipse rx="4.5" ry="12" fill="rgba(255,255,255,0.62)" transform="rotate(72)"/>
                    <ellipse rx="4.5" ry="12" fill="rgba(255,255,255,0.62)" transform="rotate(144)"/>
                    <ellipse rx="4.5" ry="12" fill="rgba(255,255,255,0.62)" transform="rotate(216)"/>
                    <ellipse rx="4.5" ry="12" fill="rgba(255,255,255,0.62)" transform="rotate(288)"/>
                    <circle r="3.5" fill="rgba(255,255,255,0.90)"/>
                  </g>
                  <g transform="translate(193,184) rotate(20)">
                    <ellipse rx="4" ry="11" fill="rgba(255,255,255,0.70)"/>
                    <ellipse rx="4" ry="11" fill="rgba(255,255,255,0.60)" transform="rotate(72)"/>
                    <ellipse rx="4" ry="11" fill="rgba(255,255,255,0.60)" transform="rotate(144)"/>
                    <ellipse rx="4" ry="11" fill="rgba(255,255,255,0.60)" transform="rotate(216)"/>
                    <ellipse rx="4" ry="11" fill="rgba(255,255,255,0.60)" transform="rotate(288)"/>
                    <circle r="3" fill="rgba(255,255,255,0.88)"/>
                  </g>
                </svg>
              </div>
            </div>

            {/* Right: info cards */}
            <div className="hidden lg:flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "0.42s" }}>
              <div className="card p-5">
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "var(--icon-bg)" }}
                >
                  <Calendar className="h-5 w-5" style={{ color: "var(--navy)" }} />
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--navy)" }}>Plan Ahead</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--taupe)" }}>
                  Plan your wishes in advance for peace of mind.
                </p>
                <Link
                  href="/compare"
                  className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:bg-gray-50"
                  style={{ border: "1.5px solid var(--border)", color: "var(--navy)" }}
                >
                  Learn More
                </Link>
              </div>

              <div className="card p-5">
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: "var(--icon-bg)" }}
                >
                  <GitCompare className="h-5 w-5" style={{ color: "var(--navy)" }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--navy)" }}>Need Immediate Help?</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--taupe)" }}>
                  Our AI assistant is here 24/7 to guide your family through every option.
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Ask Eulogy →</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-12" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              Icon: Shield,
              title: "Personalized Services",
              desc: "Every life is unique. We surface pricing so your family can choose exactly what feels right.",
              delay: "0.05s",
            },
            {
              Icon: Heart,
              title: "Caring Support",
              desc: "Our AI assistant is here to guide you through pricing options with empathy, not pressure.",
              delay: "0.10s",
            },
            {
              Icon: Users,
              title: "For Every Family",
              desc: "Compare services across traditions, cultures, and budgets in your area.",
              delay: "0.15s",
            },
            {
              Icon: BookOpen,
              title: "Helpful Resources",
              desc: "Find guidance, checklists, and your legal rights under the FTC Funeral Rule.",
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
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--taupe)" }}>{desc}</p>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: "var(--icon-bg)" }}
              >
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--navy)" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote banner ──────────────────────────────────────────────── */}
      <section className="px-6 py-14" style={{ background: "var(--paper)" }}>
        <div className="mx-auto max-w-4xl animate-fade-up text-center" style={{ animationDelay: "0.1s" }}>
          <span
            className="font-serif text-6xl leading-none"
            style={{ color: "var(--blue-pale)" }}
          >
            &ldquo;
          </span>
          <p
            className="font-serif text-xl mt-1 mb-4"
            style={{ color: "var(--taupe)", lineHeight: "1.75" }}
          >
            What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>— Helen Keller</p>
        </div>
      </section>

      {/* ── Trust badges ──────────────────────────────────────────────── */}
      <section className="px-6 py-14" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl grid gap-6 grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Shield,   title: "Trusted & Experienced",  desc: "Built on the FTC Funeral Rule to protect your family." },
            { Icon: Heart,    title: "Compassionate Care",      desc: "Treating every family with dignity and respect." },
            { Icon: BookOpen, title: "Thoughtful Planning",     desc: "Helping you plan with clarity and confidence." },
            { Icon: Lock,     title: "Secure & Private",        desc: "Your information and searches are safe with us." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.05s" }}>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: "var(--icon-bg)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "var(--navy)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Search results ─────────────────────────────────────────────── */}
      <section className="px-6 pb-20 pt-12" style={{ background: "var(--cream)" }}>
        <div className="mx-auto max-w-7xl">
          <SearchResults searchParams={searchParams} />
        </div>
      </section>

    </div>
  );
}
