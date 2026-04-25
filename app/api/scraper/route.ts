import { prisma } from "@/lib/prisma";
import { scrapeUrl } from "@/lib/scraper";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { url, funeralHomeId } = await request.json();

  if (!url) {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  // Create a scraper job
  const job = await prisma.scraperJob.create({
    data: { url, funeralHomeId: funeralHomeId || null, status: "RUNNING", lastRun: new Date() },
  });

  try {
    const scraped = await scrapeUrl(url);

    // If a funeral home ID is provided, save the services
    if (funeralHomeId && scraped.services.length > 0) {
      for (const s of scraped.services) {
        await prisma.service.create({
          data: {
            funeralHomeId,
            category: s.category,
            name: s.name,
            price: s.price,
            priceMin: s.priceMin,
            priceMax: s.priceMax,
            description: s.description,
          },
        });
      }

      // Update data source if it was auto-detected
      await prisma.funeralHome.update({
        where: { id: funeralHomeId },
        data: { dataSource: "SCRAPED" },
      });
    }

    await prisma.scraperJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", results: JSON.stringify(scraped) },
    });

    return Response.json({ job: { ...job, status: "COMPLETED" }, scraped });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    await prisma.scraperJob.update({
      where: { id: job.id },
      data: { status: "FAILED", error },
    });
    return Response.json({ error }, { status: 500 });
  }
}

export async function GET() {
  const jobs = await prisma.scraperJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { funeralHome: { select: { name: true } } },
  });
  return Response.json(jobs);
}
