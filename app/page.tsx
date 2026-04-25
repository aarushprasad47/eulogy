import Link from "next/link";
import Image from "next/image";
import {
  Shield, Mail, Globe, Heart, Users,
  ChevronRight, Calendar, Phone, MapPin,
} from "lucide-react";
import ChatOpenButton from "@/components/ChatOpenButton";

// Pre-loaded LA comparison — Hollywood Forever + Affordable Cremation
const COMPARE_URL =
  "/compare?ids=cmwjkqh64veq9ukays,3u51fqskcsaoxo48qe";

export default function Home() {
  return (
    <div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-12 pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px_300px] lg:items-start">

            {/* Left: headline + chat CTA */}
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

              {/* Location indicator */}
              <div
                className="animate-fade-up mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: "rgba(255,255,255,0.60)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid var(--border)",
                  color: "var(--taupe)",
                  animationDelay: "0.24s",
                }}
              >
                <MapPin className="h-3.5 w-3.5" style={{ color: "var(--navy)" }} />
                <span className="text-xs font-medium">Los Angeles</span>
              </div>

              {/* CTA buttons */}
              <div
                className="animate-fade-up mt-6 flex flex-col gap-3"
                style={{ animationDelay: "0.28s" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--taupe)" }}>
                  Not sure where to start? Let Eulogy guide you.
                </p>
                <div className="flex flex-wrap gap-3">
                  <ChatOpenButton />
                  <Link
                    href={COMPARE_URL}
                    className="rounded-full px-7 py-3 text-sm font-semibold transition-all hover:bg-white/70"
                    style={{
                      border: "1.5px solid rgba(68,114,168,0.4)",
                      color: "var(--navy)",
                      background: "rgba(255,255,255,0.50)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Compare Prices
                  </Link>
                </div>
              </div>
            </div>

            {/* Center: arch photo */}
            <div className="hidden lg:block animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div
                style={{
                  width: 360,
                  height: 480,
                  borderRadius: "180px 180px 0 0",
                  overflow: "hidden",
                  position: "relative",
                  margin: "0 auto",
                  boxShadow: "0 20px 60px -12px rgba(68,114,168,0.22)",
                }}
              >
                <Image
                  src="/hero-lily.png"
                  alt="Funeral service"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 30%" }}
                />
              </div>
            </div>

            {/* Right: floating info cards */}
            <div
              className="hidden lg:flex flex-col gap-4 animate-fade-up pt-8"
              style={{ animationDelay: "0.42s" }}
            >
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
                  href={COMPARE_URL}
                  className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold"
                  style={{ border: "1.5px solid var(--border)", color: "var(--navy)" }}
                >
                  Learn More
                </Link>
              </div>

              <div className="card p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--icon-bg)" }}
                  >
                    <Phone className="h-4 w-4" style={{ color: "var(--navy)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: "var(--navy)" }}>
                      Need Immediate Help?
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--taupe)" }}>
                      We&apos;re here 24/7 to support you and your family.
                    </p>
                    <ChatOpenButton small />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="px-6 pb-14 pt-10">
        <div className="mx-auto max-w-7xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Shield,  title: "Personalized Services", desc: "Every life is unique. We create meaningful services that reflect your loved one's story.",    delay: "0.05s" },
            { Icon: Heart,   title: "Caring Support",        desc: "Our compassionate team is here to guide you every step of the way.",                           delay: "0.10s" },
            { Icon: Users,   title: "For Every Family",      desc: "Services for all traditions, cultures, and beliefs.",                                          delay: "0.15s" },
            { Icon: Calendar,title: "Helpful Resources",     desc: "Find guidance, checklists, and support when you need it most.",                                 delay: "0.20s" },
          ].map(({ Icon, title, desc, delay }) => (
            <div key={title} className="card animate-fade-up p-5" style={{ animationDelay: delay }}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--icon-bg)" }}>
                <Icon className="h-5 w-5" style={{ color: "var(--navy)" }} />
              </div>
              <h3 className="mb-2 font-semibold" style={{ color: "var(--navy)" }}>{title}</h3>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--taupe)" }}>{desc}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--icon-bg)" }}>
                <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--navy)" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote — free-floating ─────────────────────────────────────── */}
      <section className="px-6 py-8">
        <div
          className="mx-auto max-w-4xl animate-fade-up rounded-2xl px-10 py-8"
          style={{
            background: "rgba(244,247,251,0.82)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(10px)",
            animationDelay: "0.1s",
          }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-serif text-5xl leading-none shrink-0" style={{ color: "var(--blue-pale)" }}>&ldquo;&ldquo;</span>
            <p className="font-serif flex-1 text-base" style={{ color: "var(--taupe)", lineHeight: "1.75", minWidth: "200px" }}>
              What we have once enjoyed we can never lose. All that we love deeply becomes a part of us.
            </p>
            <p className="text-sm font-medium shrink-0" style={{ color: "var(--muted)" }}>— Helen Keller</p>
          </div>
        </div>
      </section>

      {/* ── How we collect data ──────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-6">
        <div className="mx-auto max-w-7xl grid gap-8 grid-cols-1 sm:grid-cols-3">
          {[
            { Icon: Shield, title: "Self-Reported",  desc: "Funeral homes that voluntarily list their prices on Eulogy — the most accurate and up-to-date data available." },
            { Icon: Globe,  title: "Web-Scraped",    desc: "Our system automatically scans funeral home websites for publicly posted GPL pricing information." },
            { Icon: Mail,   title: "GPL Email Bot",  desc: "We email funeral homes requesting their General Price List, as required under the FTC Funeral Rule." },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(6px)", border: "1px solid var(--border)" }}>
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

    </div>
  );
}
