import Link from "next/link";
import { Search, Shield, DollarSign, Mail, ArrowRight, Scale } from "lucide-react";
import SearchResults from "./SearchResults";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #FAECD8 0%, #FEF8F0 40%, var(--cream) 100%)",
        }}
      >
        {/* Subtle decorative circles */}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C4692A 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3D6B4F 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <p
            className="animate-fade-in mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest"
            style={{
              background: "rgba(196,105,42,0.1)",
              color: "var(--amber)",
              animationDelay: "0s",
            }}
          >
            <Scale className="h-3 w-3" />
            Funeral Price Transparency
          </p>

          <h1
            className="animate-fade-up font-serif text-5xl font-semibold leading-[1.15] sm:text-6xl"
            style={{ color: "var(--brown)", animationDelay: "0.1s" }}
          >
            You deserve honest pricing
            <br />
            <em className="not-italic" style={{ color: "var(--amber)" }}>
              during an impossible time.
            </em>
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--taupe)", animationDelay: "0.2s" }}
          >
            Funeral homes are legally required to share their prices. Eulogy compiles
            those prices so your family can compare, plan, and save — without the pressure.
          </p>

          <div className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <SearchBar />
          </div>

          <p
            className="animate-fade-up mt-5 text-xs"
            style={{ color: "var(--muted)", animationDelay: "0.4s" }}
          >
            Try &ldquo;Seattle&rdquo; &nbsp;·&nbsp; &ldquo;10001&rdquo; &nbsp;·&nbsp; &ldquo;direct cremation&rdquo;
          </p>
        </div>
      </section>

      {/* ── How we collect prices ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <p
          className="mb-10 text-center text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          How we collect prices
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Self-Reported"
            desc="Funeral homes that list their prices directly on Eulogy. The most accurate and up-to-date."
            bg="#EAF2ED"
            color="var(--sage)"
            delay="0.05s"
          />
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Web-Scraped"
            desc="Our system scans funeral home websites for publicly posted pricing information."
            bg="#EEF2FF"
            color="#4F62C4"
            delay="0.1s"
          />
          <FeatureCard
            icon={<Mail className="h-5 w-5" />}
            title="GPL Request"
            desc="We email funeral homes requesting their General Price List, as allowed by the FTC Funeral Rule."
            bg="#F5EEF8"
            color="#8B5CF6"
            delay="0.15s"
          />
        </div>
      </section>

      {/* ── Rights callout ───────────────────────────────────────────── */}
      <section
        className="mx-4 mb-16 rounded-2xl sm:mx-auto sm:max-w-5xl"
        style={{ background: "var(--amber-light)", border: "1px solid #F5D99A" }}
      >
        <div className="px-6 py-8 sm:px-10">
          <div className="flex gap-4">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(196,105,42,0.15)" }}
            >
              <DollarSign className="h-4 w-4" style={{ color: "var(--amber)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-base" style={{ color: "#7A3F00" }}>
                Know your rights under the FTC Funeral Rule
              </h3>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "#8B4800" }}>
                {[
                  "Funeral homes must give you a price list when you visit or ask",
                  "You can decline any service you don't want",
                  "You can provide your own casket — they must accept it",
                  "Embalming is not legally required in most cases",
                  "You must receive an itemized statement before payment",
                ].map((right) => (
                  <li key={right} className="flex items-start gap-2">
                    <span className="mt-0.5 text-base leading-none" style={{ color: "var(--amber)" }}>✓</span>
                    <span>{right}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Compare CTA ──────────────────────────────────────────────── */}
      <section
        className="mx-4 mb-16 rounded-2xl text-center sm:mx-auto sm:max-w-5xl"
        style={{ background: "white", border: "1px solid var(--border)" }}
      >
        <div className="px-6 py-10">
          <h2 className="font-serif text-2xl font-semibold" style={{ color: "var(--brown)" }}>
            Compare prices side-by-side
          </h2>
          <p className="mt-2 text-sm" style={{ color: "var(--taupe)" }}>
            Select any funeral homes and instantly see a full price breakdown across every service category.
          </p>
          <Link
            href="/compare"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-lg"
            style={{ background: "var(--amber)" }}
          >
            Open comparison tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Search results ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <SearchResults searchParams={searchParams} />
      </section>
    </div>
  );
}

function SearchBar() {
  return (
    <form
      action="/"
      method="GET"
      className="mt-8 flex gap-2 rounded-2xl p-1.5 shadow-lg"
      style={{ background: "white", border: "1px solid var(--border)" }}
    >
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
        <input
          type="text"
          name="q"
          placeholder="City, ZIP code, or funeral home name..."
          className="w-full rounded-xl py-3 pl-10 pr-4 text-base outline-none"
          style={{ background: "transparent", color: "var(--brown)" }}
        />
      </div>
      <button
        type="submit"
        className="rounded-xl px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
        style={{ background: "var(--amber)" }}
      >
        Search
      </button>
    </form>
  );
}

function FeatureCard({
  icon, title, desc, bg, color, delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bg: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      className="card animate-fade-up p-6"
      style={{ animationDelay: delay }}
    >
      <div
        className="inline-flex items-center justify-center rounded-xl p-2.5"
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <h3 className="mt-4 font-semibold" style={{ color: "var(--brown)" }}>
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--taupe)" }}>
        {desc}
      </p>
    </div>
  );
}
