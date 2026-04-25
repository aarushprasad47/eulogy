import { prisma } from "@/lib/prisma";
import { MapPin } from "lucide-react";
import type { MapHome } from "@/components/ExploreMap";
import ExploreMapWrapper from "@/components/ExploreMapWrapper";

export default async function ExplorePage() {
  const raw = await prisma.funeralHome.findMany({
    where: {
      services: { some: {} },
      lat: { not: null },
      lng: { not: null },
    },
    include: {
      services: {
        orderBy: { price: "asc" },
        take: 10,
      },
    },
    orderBy: { name: "asc" },
  });

  // Narrow types so lat/lng are non-null
  const homes: MapHome[] = raw
    .filter((h) => h.lat != null && h.lng != null)
    .map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      city: h.city,
      state: h.state,
      lat: h.lat as number,
      lng: h.lng as number,
      services: h.services.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        price: s.price,
        priceMin: s.priceMin,
        priceMax: s.priceMax,
      })),
    }));

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Info bar */}
      <div
        className="flex shrink-0 items-center gap-3 px-6 py-3"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <MapPin className="h-4 w-4" style={{ color: "var(--navy)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>
          {homes.length} funeral home{homes.length !== 1 ? "s" : ""} with pricing data in the LA area
        </p>
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          — hover or click a pin to see prices
        </span>
      </div>

      {/* Map — fills remaining height */}
      <div className="flex-1 relative">
        <ExploreMapWrapper homes={homes} />
      </div>
    </div>
  );
}
