import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Globe, Mail, CheckCircle, ArrowLeft, GitCompare } from "lucide-react";
import { formatPrice, SERVICE_CATEGORIES } from "@/lib/utils";
import ScraperButton from "./ScraperButton";
import EmailBotButton from "./EmailBotButton";
import CallButton from "./CallButton";

const SOURCE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  SELF_REPORTED: { label: "Self-reported by funeral home",  bg: "var(--sage-light)", color: "var(--sage)" },
  SCRAPED:       { label: "Scraped from website",           bg: "#EEF2FF",           color: "#4F62C4"     },
  GPL_EMAIL:     { label: "Received via GPL email request", bg: "#F5EEF8",           color: "#8B5CF6"     },
  GPL_CALL:      { label: "Collected via phone call",       bg: "#FFF7ED",           color: "#C2610F"     },
};

export default async function FuneralHomePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const home = await prisma.funeralHome.findUnique({
    where: { id },
    include: { services: { orderBy: { category: "asc" } } },
  });
  if (!home) notFound();

  const byCategory = new Map<string, typeof home.services>();
  for (const s of home.services) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  const source = SOURCE_LABELS[home.dataSource] ?? SOURCE_LABELS.SELF_REPORTED;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="animate-fade-in mb-6 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
        style={{ color: "var(--muted)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to search
      </Link>

      {/* Header card */}
      <div
        className="card animate-fade-up p-6"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="font-serif text-2xl font-semibold"
                style={{ color: "var(--brown)" }}
              >
                {home.name}
              </h1>
              {home.verified && (
                <CheckCircle className="h-5 w-5" style={{ color: "var(--sage)" }} />
              )}
            </div>
            <p
              className="mt-1.5 flex items-center gap-1.5 text-sm"
              style={{ color: "var(--taupe)" }}
            >
              <MapPin className="h-3.5 w-3.5" />
              {home.address}, {home.city}, {home.state} {home.zip}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: source.bg, color: source.color }}
            >
              {source.label}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Updated{" "}
              {new Date(home.updatedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm" style={{ color: "var(--taupe)" }}>
          {home.phone && (
            <a
              href={`tel:${home.phone}`}
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--brown)]"
            >
              <Phone className="h-4 w-4" /> {home.phone}
            </a>
          )}
          {home.website && (
            <a
              href={home.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--brown)]"
            >
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          {home.email && (
            <a
              href={`mailto:${home.email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--brown)]"
            >
              <Mail className="h-4 w-4" /> {home.email}
            </a>
          )}
        </div>

        {/* Actions */}
        <div
          className="mt-4 flex flex-wrap gap-2 border-t pt-4"
          style={{ borderColor: "var(--border)" }}
        >
          {home.website && <ScraperButton homeId={home.id} website={home.website} />}
          {home.email && <EmailBotButton homeId={home.id} email={home.email} />}
          {home.phone && <CallButton homeId={home.id} phone={home.phone} homeName={home.name} />}
          <Link
            href={`/compare?ids=${home.id}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: "var(--peach)", color: "var(--amber)" }}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Add to comparison
          </Link>
        </div>
      </div>

      {/* Price tables */}
      {home.services.length === 0 ? (
        <div
          className="animate-fade-up mt-6 rounded-2xl border-2 border-dashed p-12 text-center"
          style={{ borderColor: "var(--border)", background: "white", animationDelay: "0.1s" }}
        >
          <p className="font-medium" style={{ color: "var(--taupe)" }}>
            No pricing data available yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Use the buttons above to trigger a web scrape or send a GPL request.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {SERVICE_CATEGORIES.filter((cat) => byCategory.has(cat.key)).map((cat, i) => (
            <div
              key={cat.key}
              className="card animate-fade-up overflow-hidden"
              style={{ animationDelay: `${0.1 + i * 0.04}s` }}
            >
              <div
                className="border-b px-5 py-3"
                style={{ borderColor: "var(--border)", background: "var(--paper)" }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--taupe)" }}>
                  {cat.label}
                </h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {byCategory.get(cat.key)!.map((s, j) => (
                    <tr
                      key={s.id}
                      style={{
                        background: j % 2 === 0 ? "white" : "var(--cream)",
                        borderTop: j > 0 ? "1px solid var(--border)" : undefined,
                      }}
                    >
                      <td className="px-5 py-3" style={{ color: "var(--taupe)" }}>
                        {s.name}
                      </td>
                      <td
                        className="px-5 py-3 text-right font-semibold"
                        style={{ color: "var(--brown)" }}
                      >
                        {s.price != null
                          ? formatPrice(s.price)
                          : s.priceMin != null
                          ? `${formatPrice(s.priceMin)} – ${formatPrice(s.priceMax)}`
                          : "Call for pricing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <p
        className="animate-fade-in mt-8 text-center text-xs"
        style={{ color: "var(--muted)", animationDelay: "0.5s" }}
      >
        Prices collected via the FTC Funeral Rule. Always verify directly with the funeral home.
      </p>
    </div>
  );
}
