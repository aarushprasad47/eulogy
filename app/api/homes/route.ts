import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const zip = searchParams.get("zip");
  const query = searchParams.get("q");

  const where: Record<string, unknown> = {};

  if (city) where.city = { contains: city };
  if (state) where.state = state.toUpperCase();
  if (zip) where.zip = zip;
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { city: { contains: query } },
      { address: { contains: query } },
    ];
  }

  const homes = await prisma.funeralHome.findMany({
    where,
    include: { services: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  return Response.json(homes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { services, ...homeData } = body;

  const home = await prisma.funeralHome.create({
    data: {
      ...homeData,
      dataSource: "SELF_REPORTED",
      services: services
        ? { create: services }
        : undefined,
    },
    include: { services: true },
  });

  return Response.json(home, { status: 201 });
}
