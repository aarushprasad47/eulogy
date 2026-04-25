import { prisma } from "@/lib/prisma";
import { sendGplRequest } from "@/lib/email-bot";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { funeralHomeId, emailAddress, dryRun } = await request.json();

  const home = await prisma.funeralHome.findUnique({
    where: { id: funeralHomeId },
  });

  if (!home) {
    return Response.json({ error: "Funeral home not found" }, { status: 404 });
  }

  const email = emailAddress || home.email;
  if (!email) {
    return Response.json({ error: "No email address available" }, { status: 400 });
  }

  // Check for existing recent request (within 30 days)
  const recentRequest = await prisma.gplRequest.findFirst({
    where: {
      funeralHomeId,
      status: { in: ["SENT", "RESPONDED"] },
      emailSentAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  if (recentRequest && !dryRun) {
    return Response.json(
      { error: "A GPL request was already sent to this funeral home within the last 30 days", existing: recentRequest },
      { status: 409 }
    );
  }

  if (dryRun) {
    return Response.json({
      dryRun: true,
      to: email,
      funeralHomeName: home.name,
      message: "Dry run — no email sent",
    });
  }

  const gplRequest = await prisma.gplRequest.create({
    data: {
      funeralHomeId,
      emailAddress: email,
      status: "PENDING",
    },
  });

  try {
    await sendGplRequest({ to: email, funeralHomeName: home.name });

    await prisma.gplRequest.update({
      where: { id: gplRequest.id },
      data: { status: "SENT", emailSentAt: new Date() },
    });

    return Response.json({ success: true, requestId: gplRequest.id, sentTo: email });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await prisma.gplRequest.update({
      where: { id: gplRequest.id },
      data: { status: "FAILED", notes: error },
    });
    return Response.json({ error }, { status: 500 });
  }
}

export async function GET() {
  const requests = await prisma.gplRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { funeralHome: { select: { name: true, city: true, state: true } } },
  });
  return Response.json(requests);
}
