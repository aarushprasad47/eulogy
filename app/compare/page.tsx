import { prisma } from "@/lib/prisma";
import { formatPrice, SERVICE_CATEGORIES } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import CompareSelector from "./CompareSelector";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const selectedIds = ids ? ids.split(",").filter(Boolean) : [];

  const allHomes = await prisma.funeralHome.findMany({
    where: { services: { some: {} } },
    select: { id: true, name: true, city: true, state: true },
    orderBy: { name: "asc" },
  });

  const selectedHomes =
    selectedIds.length > 0
      ? await prisma.funeralHome.findMany({
          where: { id: { in: selectedIds } },
          include: { services: true },
        })
      : [];

  const priceMap = new Map<string, Map<string, string>>();
  for (const home of selectedHomes) {
    for (const s of home.services) {
      if (!priceMap.has(s.category)) priceMap.set(s.category, new Map());
      const p =
        s.price != null ? formatPrice(s.price)
        : s.priceMin != null ? `${formatPrice(s.priceMin)}–${formatPrice(s.priceMax)}`
        : "—";
      if (!priceMap.get(s.category)!.has(home.id)) {
        priceMap.get(s.category)!.set(home.id, p);
      }
    }
  }

  function cheapestId(category: string): string | null {
    const catMap = priceMap.get(category);
    if (!catMap) return null;
    let minPrice = Infinity;
    let minId: string | null = null;
    for (const home of selectedHomes) {
      const s = home.services.find((sv) => sv.category === category);
      if (!s) continue;
      const price = s.price ?? s.priceMin;
      if (price != null && price < minPrice) { minPrice = price; minId = home.id; }
    }
    return minId;
  }

  const shownCategories = SERVICE_CATEGORIES.filter((cat) =>
    selectedHomes.some((h) => h.services.some((s) => s.category === cat.key))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1
          className="font-serif text-3xl font-semibold"
          style={{ color: "var(--brown)" }}
        >
          Compare Funeral Homes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--taupe)" }}>
          Select up to 4 funeral homes to compare prices side-by-side.
          Green cells indicate the lowest price for that service.
        </p>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "0.1s", position: "relative", zIndex: 10 }}>
        <CompareSelector allHomes={allHomes} selectedIds={selectedIds} />
      </div>

      {selectedHomes.length >= 2 ? (
        <div
          className="animate-fade-up mt-8 overflow-x-auto rounded-2xl"
          style={{
            border: "1px solid var(--border)",
            background: "white",
            animationDelay: "0.15s",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--paper)" }}>
                <th
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide w-52"
                  style={{ color: "var(--muted)" }}
                >
                  Service
                </th>
                {selectedHomes.map((h) => (
                  <th key={h.id} className="px-5 py-4 text-center">
                    <Link
                      href={`/homes/${h.id}`}
                      className="font-semibold transition-opacity hover:opacity-70"
                      style={{ color: "var(--brown)" }}
                    >
                      {h.name}
                    </Link>
                    <div className="mt-0.5 flex items-center justify-center gap-1">
                      {h.verified && (
                        <CheckCircle className="h-3 w-3" style={{ color: "var(--sage)" }} />
                      )}
                      <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>
                        {h.city}, {h.state}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shownCategories.map((cat, catIdx) => {
                const best = cheapestId(cat.key);
                return (
                  <tr
                    key={cat.key}
                    style={{
                      background: catIdx % 2 === 0 ? "white" : "var(--cream)",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <td
                      className="px-5 py-3.5 text-xs font-medium uppercase tracking-wide"
                      style={{ color: "var(--taupe)" }}
                    >
                      {cat.label}
                    </td>
                    {selectedHomes.map((h) => {
                      const val = priceMap.get(cat.key)?.get(h.id) ?? "—";
                      const isCheapest = best === h.id && val !== "—";
                      return (
                        <td
                          key={h.id}
                          className="px-5 py-3.5 text-center font-medium transition-colors"
                          style={{
                            color: isCheapest ? "var(--sage)" : "var(--brown)",
                            background: isCheapest ? "var(--sage-light)" : undefined,
                          }}
                        >
                          {val}
                          {isCheapest && (
                            <span
                              className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs"
                              style={{ background: "rgba(61,107,79,0.12)", color: "var(--sage)" }}
                            >
                              lowest
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="animate-fade-up mt-8 rounded-2xl border-2 border-dashed p-16 text-center"
          style={{ borderColor: "var(--border)", background: "white", animationDelay: "0.15s" }}
        >
          {selectedHomes.length === 1 ? (
            <p style={{ color: "var(--muted)" }}>Select at least one more funeral home to compare.</p>
          ) : (
            <>
              <p className="font-medium" style={{ color: "var(--taupe)" }}>
                Start comparing funeral home prices
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Search for funeral homes above and select 2 or more to see a side-by-side comparison.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
