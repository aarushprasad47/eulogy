import { prisma } from "@/lib/prisma";
import FuneralHomeCard from "@/components/FuneralHomeCard";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string; category?: string }>;
}

const STAGGER = [
  "stagger-1","stagger-2","stagger-3","stagger-4","stagger-5","stagger-6",
  "stagger-7","stagger-8","stagger-9","stagger-10","stagger-11","stagger-12",
];

export default async function SearchResults({ searchParams }: Props) {
  const { q, category } = await searchParams;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { city: { contains: q } },
      { zip:  { contains: q } },
      { state: { contains: q } },
    ];
  }

  const homes = await prisma.funeralHome.findMany({
    where,
    include: {
      services: category ? { where: { category } } : { take: 6 },
    },
    orderBy: [{ services: { _count: "desc" } }, { name: "asc" }],
    take: 24,
  });

  if (homes.length === 0 && q) {
    return (
      <div
        className="animate-fade-in rounded-2xl p-16 text-center"
        style={{ background: "white", border: "1px solid var(--border)" }}
      >
        <p className="text-base font-medium" style={{ color: "var(--brown)" }}>
          No results for &ldquo;{q}&rdquo;
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Try a different city or ZIP code, or{" "}
          <Link href="/register" className="underline" style={{ color: "var(--amber)" }}>
            add a funeral home
          </Link>.
        </p>
      </div>
    );
  }

  const title = q
    ? `${homes.length} funeral home${homes.length !== 1 ? "s" : ""} near "${q}"`
    : "All funeral homes";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "var(--brown)" }}>
          {title}
        </h2>
        <Link
          href="/compare"
          className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
          style={{ color: "var(--amber)" }}
        >
          Compare side-by-side →
        </Link>
      </div>

      {homes.length === 0 ? (
        <div className="py-16 text-center" style={{ color: "var(--muted)" }}>
          <p>No funeral homes in the database yet.</p>
          <p className="mt-2 text-sm">
            <Link href="/register" className="underline" style={{ color: "var(--amber)" }}>
              Be the first to list your funeral home.
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((h, i) => (
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
              animationDelay={`${Math.min(i, 11) * 0.05}s`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
