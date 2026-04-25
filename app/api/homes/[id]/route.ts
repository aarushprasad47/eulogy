import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const home = await prisma.funeralHome.findUnique({
    where: { id },
    include: { services: { orderBy: { category: "asc" } } },
  });

  if (!home) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json(home);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const home = await prisma.funeralHome.update({
    where: { id },
    data: body,
    include: { services: true },
  });

  return Response.json(home);
}
