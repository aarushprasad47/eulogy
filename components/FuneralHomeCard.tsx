import Link from "next/link";
import { MapPin, Phone, CheckCircle, Globe, Mail } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  category: string;
}

interface FuneralHomeCardProps {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  verified: boolean;
  dataSource: string;
  services: Service[];
  highlightCategory?: string;
  animationDelay?: string;
}

const SOURCE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  SELF_REPORTED: { label: "Self-reported", bg: "var(--sage-light)", color: "var(--sage)" },
  SCRAPED:       { label: "Web-scraped",   bg: "#EEF2FF",           color: "#4F62C4"     },
  GPL_EMAIL:     { label: "GPL verified",  bg: "#F5EEF8",           color: "#8B5CF6"     },
};

function servicePrice(s: Service): string {
  if (s.price != null)    return formatPrice(s.price);
  if (s.priceMin != null) return `${formatPrice(s.priceMin)} – ${formatPrice(s.priceMax)}`;
  return "Call for pricing";
}

export default function FuneralHomeCard({
  id, name, address, city, state, zip,
  phone, email, website, verified, dataSource,
  services, highlightCategory, animationDelay,
}: FuneralHomeCardProps) {
  const source = SOURCE_LABELS[dataSource] ?? SOURCE_LABELS.SELF_REPORTED;

  const highlighted = highlightCategory
    ? services.filter((s) => s.category === highlightCategory)
    : services.slice(0, 4);

  const minPrice = services
    .map((s) => s.price ?? s.priceMin)
    .filter((p): p is number => p != null)
    .reduce((a, b) => Math.min(a, b), Infinity);

  const hasPrices = services.length > 0;

  return (
    <div
      className="card animate-fade-up flex flex-col p-5"
      style={{ animationDelay }}
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3
              className="font-semibold leading-snug truncate"
              style={{ color: "var(--brown)" }}
            >
              {name}
            </h3>
            {verified && (
              <CheckCircle
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--sage)" }}
                aria-label="Verified"
              />
            )}
          </div>
          <p
            className="mt-0.5 flex items-center gap-1 text-xs"
            style={{ color: "var(--muted)" }}
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {city}, {state} {zip}
          </p>
        </div>

        <span
          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ background: source.bg, color: source.color }}
        >
          {source.label}
        </span>
      </div>

      {/* Contact row */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs" style={{ color: "var(--muted)" }}>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1 transition-colors hover:text-[var(--brown)]"
          >
            <Phone className="h-3 w-3" /> {phone}
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-[var(--brown)]"
          >
            <Globe className="h-3 w-3" /> Website
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1 transition-colors hover:text-[var(--brown)]"
          >
            <Mail className="h-3 w-3" /> Email
          </a>
        )}
      </div>

      {/* Services preview */}
      {highlighted.length > 0 && (
        <div
          className="mt-3 space-y-1.5 rounded-xl p-3"
          style={{ background: "var(--paper)" }}
        >
          {highlighted.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate" style={{ color: "var(--taupe)" }}>
                {s.name}
              </span>
              <span className="shrink-0 font-medium" style={{ color: "var(--brown)" }}>
                {servicePrice(s)}
              </span>
            </div>
          ))}
        </div>
      )}

      {!hasPrices && (
        <div
          className="mt-3 rounded-xl p-3 text-center text-xs"
          style={{ background: "var(--paper)", color: "var(--muted)" }}
        >
          Pricing not yet available — call to request their GPL
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4">
        {minPrice !== Infinity ? (
          <p className="text-xs" style={{ color: "var(--taupe)" }}>
            From{" "}
            <span className="font-semibold" style={{ color: "var(--sage)" }}>
              {formatPrice(minPrice)}
            </span>
          </p>
        ) : (
          <span />
        )}
        <Link
          href={`/homes/${id}`}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80"
          style={{ background: "var(--peach)", color: "var(--amber)" }}
        >
          View prices →
        </Link>
      </div>
    </div>
  );
}
