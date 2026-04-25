import { prisma } from "@/lib/prisma";
import FuneralHomeCard from "@/components/FuneralHomeCard";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchResults({ searchParams }: Props) {
  const { q, category } = await searchParams;

  const where: Record<string, unknown> = {};

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { city: { contains: q } },
      { zip: { contains: q } },
      { state: { contains: q } },
    ];
  }

  const homes = await prisma.funeralHome.findMany({
    where,
    include: {
      services: category ? { where: { category } } : { take: 6 },
    },
    orderBy: { name: "asc" },
    take: 24,
  });

  if (homes.length === 0 && q) {
    return (
      <div className="py-16 text-center">
        <p className="text-stone-500">
          No funeral homes found for &ldquo;{q}&rdquo;. Try a different city or ZIP code.
        </p>
        <p className="mt-2 text-sm text-stone-400">
          Want to add a funeral home? <a href="/register" className="underline">Submit prices here.</a>
        </p>
      </div>
    );
  }

  const title = q
    ? `${homes.length} funeral home${homes.length !== 1 ? "s" : ""} near "${q}"`
    : "All funeral homes";

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-semibold text-stone-900">{title}</h2>
        <a href="/compare" className="text-sm text-stone-500 underline hover:text-stone-800">
          Side-by-side compare →
        </a>
      </div>

      {homes.length === 0 ? (
        <div className="py-16 text-center text-stone-400">
          <p>No funeral homes in the database yet.</p>
          <p className="mt-2 text-sm">
            <a href="/register" className="underline">Be the first to add your funeral home.</a>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((h) => (
            <FuneralHomeCard
              key={h.id}
              id={h.id}
              name={h.name}
              address={h.address}
              city={h.city}
              state={h.state}
              zip={h.zip}
              phone={h.phone}
              email={h.email}
              website={h.website}
              verified={h.verified}
              dataSource={h.dataSource}
              services={h.services}
              highlightCategory={category}
            />
          ))}
        </div>
      )}
    </div>
  );
}
