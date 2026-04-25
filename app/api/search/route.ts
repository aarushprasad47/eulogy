import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category");

  const homes = await prisma.funeralHome.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { city: { contains: q } },
        { zip: { contains: q } },
        { state: { contains: q } },
      ],
    },
    include: {
      services: category
        ? { where: { category } }
        : true,
    },
    orderBy: { name: "asc" },
    take: 30,
  });

  // Compute min price for each home (for a given category if specified)
  const results = homes.map((h) => {
    const prices = h.services
      .map((s) => s.price ?? s.priceMin)
      .filter((p): p is number => p != null);

    return {
      ...h,
      minPrice: prices.length ? Math.min(...prices) : null,
    };
  });

  return Response.json(results);
}
