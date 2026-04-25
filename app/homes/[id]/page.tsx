import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Globe, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { formatPrice, SERVICE_CATEGORIES } from "@/lib/utils";
import ScraperButton from "./ScraperButton";
import EmailBotButton from "./EmailBotButton";

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

  // Group services by category
  const byCategory = new Map<string, typeof home.services>();
  for (const s of home.services) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  const SOURCE_LABELS: Record<string, string> = {
    SELF_REPORTED: "Self-reported by funeral home",
    SCRAPED: "Scraped from funeral home website",
    EMAIL_RESPONSE: "Received via GPL email request",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to search
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-stone-900">{home.name}</h1>
              {home.verified && (
                <CheckCircle className="h-5 w-5 text-emerald-600" aria-label="Verified" />
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-stone-500">
              <MapPin className="h-4 w-4" />
              {home.address}, {home.city}, {home.state} {home.zip}
            </p>
          </div>
          <div className="text-right text-sm text-stone-400">
            <p>{SOURCE_LABELS[home.dataSource] || home.dataSource}</p>
            <p className="mt-0.5">
              Updated {new Date(home.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {home.phone && (
            <a href={`tel:${home.phone}`} className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900">
              <Phone className="h-4 w-4" /> {home.phone}
            </a>
          )}
          {home.website && (
            <a href={home.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900">
              <Globe className="h-4 w-4" /> Website
            </a>
          )}
          {home.email && (
            <a href={`mailto:${home.email}`} className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900">
              <Mail className="h-4 w-4" /> {home.email}
            </a>
          )}
        </div>

        {/* Admin-style buttons */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          {home.website && <ScraperButton homeId={home.id} website={home.website} />}
          {home.email && <EmailBotButton homeId={home.id} email={home.email} />}
          <Link
            href={`/compare?ids=${home.id}`}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
          >
            Add to comparison
          </Link>
        </div>
      </div>

      {/* Price tables by category */}
      {home.services.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="text-stone-500">No pricing data available yet.</p>
          <p className="mt-2 text-sm text-stone-400">
            You can trigger a web scrape or send a GPL request using the buttons above.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {SERVICE_CATEGORIES.filter((cat) => byCategory.has(cat.key)).map((cat) => (
            <div key={cat.key} className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="border-b border-stone-100 bg-stone-50 px-5 py-3">
                <h2 className="font-semibold text-stone-800">{cat.label}</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {byCategory.get(cat.key)!.map((s, i) => (
                    <tr
                      key={s.id}
                      className={i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}
                    >
                      <td className="px-5 py-3 text-stone-700">{s.name}</td>
                      <td className="px-5 py-3 text-right font-medium text-stone-900">
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

          {/* Catch any uncategorized */}
          {byCategory.has("OTHER") && (
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="border-b border-stone-100 bg-stone-50 px-5 py-3">
                <h2 className="font-semibold text-stone-800">Other Services</h2>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {byCategory.get("OTHER")!.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}>
                      <td className="px-5 py-3 text-stone-700">{s.name}</td>
                      <td className="px-5 py-3 text-right font-medium text-stone-900">
                        {s.price != null ? formatPrice(s.price) : "Call for pricing"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-stone-400">
        Prices are self-reported or collected via the FTC Funeral Rule. Verify directly with the funeral home.
      </p>
    </div>
  );
}
