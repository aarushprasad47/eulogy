import { prisma } from "@/lib/prisma";
import { formatPrice, SERVICE_CATEGORIES } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import CompareSelector from "./CompareSelector";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; q?: string }>;
}) {
  const { ids, q } = await searchParams;

  const selectedIds = ids ? ids.split(",").filter(Boolean) : [];

  // Fetch all homes for the selector
  const allHomes = await prisma.funeralHome.findMany({
    select: { id: true, name: true, city: true, state: true },
    orderBy: { name: "asc" },
  });

  // Fetch selected homes with services
  const selectedHomes =
    selectedIds.length > 0
      ? await prisma.funeralHome.findMany({
          where: { id: { in: selectedIds } },
          include: { services: true },
        })
      : [];

  // Build a price map: category → homeId → price string
  const priceMap = new Map<string, Map<string, string>>();
  for (const home of selectedHomes) {
    for (const s of home.services) {
      if (!priceMap.has(s.category)) priceMap.set(s.category, new Map());
      const p =
        s.price != null
          ? formatPrice(s.price)
          : s.priceMin != null
          ? `${formatPrice(s.priceMin)}–${formatPrice(s.priceMax)}`
          : "—";
      // Use the first service found per category per home (most important one)
      if (!priceMap.get(s.category)!.has(home.id)) {
        priceMap.get(s.category)!.set(home.id, p);
      }
    }
  }

  // Find cheapest home for each category
  function cheapestId(category: string): string | null {
    const catMap = priceMap.get(category);
    if (!catMap) return null;
    let minPrice = Infinity;
    let minId: string | null = null;
    for (const home of selectedHomes) {
      const s = home.services.find((sv) => sv.category === category);
      if (!s) continue;
      const price = s.price ?? s.priceMin;
      if (price != null && price < minPrice) {
        minPrice = price;
        minId = home.id;
      }
    }
    return minId;
  }

  const shownCategories = SERVICE_CATEGORIES.filter((cat) =>
    selectedHomes.some((h) => h.services.some((s) => s.category === cat.key))
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">Compare Funeral Homes</h1>
        <p className="mt-1 text-stone-500">
          Select up to 4 funeral homes to compare prices side-by-side.
        </p>
      </div>

      <CompareSelector allHomes={allHomes} selectedIds={selectedIds} />

      {selectedHomes.length >= 2 ? (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="px-5 py-4 text-left font-semibold text-stone-700 w-48">Service</th>
                {selectedHomes.map((h) => (
                  <th key={h.id} className="px-5 py-4 text-center font-semibold text-stone-900">
                    <Link href={`/homes/${h.id}`} className="hover:underline">
                      {h.name}
                    </Link>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      {h.verified && <CheckCircle className="h-3 w-3 text-emerald-600" />}
                      <span className="text-xs font-normal text-stone-400">
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
                    className={catIdx % 2 === 0 ? "bg-white" : "bg-stone-50/50"}
                  >
                    <td className="px-5 py-3 font-medium text-stone-700">{cat.label}</td>
                    {selectedHomes.map((h) => {
                      const val = priceMap.get(cat.key)?.get(h.id) ?? "—";
                      const isCheapest = best === h.id && val !== "—";
                      return (
                        <td
                          key={h.id}
                          className={`px-5 py-3 text-center font-medium ${
                            isCheapest
                              ? "text-emerald-700 bg-emerald-50"
                              : "text-stone-900"
                          }`}
                        >
                          {val}
                          {isCheapest && (
                            <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs">
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
        selectedHomes.length === 1 ? (
          <p className="mt-8 text-center text-stone-400">Select at least one more funeral home to compare.</p>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center text-stone-400">
            <p>Select 2 or more funeral homes above to see a price comparison.</p>
          </div>
        )
      )}

      {selectedHomes.length > 0 && (
        <p className="mt-4 text-center text-xs text-stone-400">
          Green cells indicate the lowest price for that service. Always verify pricing directly with the funeral home.
        </p>
      )}
    </div>
  );
}
