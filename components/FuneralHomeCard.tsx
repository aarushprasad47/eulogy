import Link from "next/link";
import { MapPin, Phone, CheckCircle, Globe, Mail } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

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
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  SELF_REPORTED: { label: "Self-reported", color: "text-emerald-700 bg-emerald-50" },
  SCRAPED: { label: "Web-scraped", color: "text-blue-700 bg-blue-50" },
  EMAIL_RESPONSE: { label: "GPL response", color: "text-violet-700 bg-violet-50" },
};

function servicePrice(s: Service): string {
  if (s.price != null) return formatPrice(s.price);
  if (s.priceMin != null) return `${formatPrice(s.priceMin)} – ${formatPrice(s.priceMax)}`;
  return "Call for pricing";
}

export default function FuneralHomeCard({
  id,
  name,
  address,
  city,
  state,
  zip,
  phone,
  email,
  website,
  verified,
  dataSource,
  services,
  highlightCategory,
}: FuneralHomeCardProps) {
  const source = SOURCE_LABELS[dataSource] ?? SOURCE_LABELS.SELF_REPORTED;

  const highlighted = highlightCategory
    ? services.filter((s) => s.category === highlightCategory)
    : services.slice(0, 5);

  const minPrice = services
    .map((s) => s.price ?? s.priceMin)
    .filter((p): p is number => p != null)
    .reduce((a, b) => Math.min(a, b), Infinity);

  return (
    <div className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-stone-900 leading-tight">{name}</h3>
            {verified && (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Verified" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-stone-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {address}, {city}, {state} {zip}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            source.color
          )}
        >
          {source.label}
        </span>
      </div>

      {/* Contact */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-stone-800">
            <Phone className="h-3 w-3" /> {phone}
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-stone-800">
            <Globe className="h-3 w-3" /> Website
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-stone-800">
            <Mail className="h-3 w-3" /> Email
          </a>
        )}
      </div>

      {/* Services preview */}
      {highlighted.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-stone-100 pt-3">
          {highlighted.map((s) => (
            <div key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-600 truncate pr-3">{s.name}</span>
              <span className="shrink-0 font-medium text-stone-900">{servicePrice(s)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        {minPrice !== Infinity && (
          <p className="text-xs text-stone-500">
            Services from <span className="font-semibold text-stone-800">{formatPrice(minPrice)}</span>
          </p>
        )}
        <Link
          href={`/homes/${id}`}
          className="ml-auto rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-200"
        >
          View all prices →
        </Link>
      </div>
    </div>
  );
}
