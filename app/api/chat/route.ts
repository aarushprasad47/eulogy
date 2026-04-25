import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { messages, location } = await request.json();

  // Fetch relevant funeral home data to ground the AI's answers
  const homes = await prisma.funeralHome.findMany({
    include: { services: true },
    take: 20,
    ...(location
      ? { where: { OR: [{ city: { contains: location } }, { zip: location }] } }
      : {}),
  });

  const priceContext =
    homes.length > 0
      ? homes
          .map((h) => {
            const lines = [`**${h.name}** — ${h.city}, ${h.state} ${h.zip}`];
            if (h.phone) lines.push(`Phone: ${h.phone}`);
            lines.push(`Data source: ${h.dataSource}`);
            const services = h.services
              .map((s) => {
                const p =
                  s.price != null
                    ? `$${s.price.toLocaleString()}`
                    : s.priceMin != null
                    ? `$${s.priceMin.toLocaleString()}–$${s.priceMax?.toLocaleString()}`
                    : "Call for pricing";
                return `  - ${s.name}: ${p}`;
              })
              .join("\n");
            lines.push("Services:\n" + services);
            return lines.join("\n");
          })
          .join("\n\n")
      : "No funeral home data found for this location yet.";

  const systemPrompt = `You are Eulogy's compassionate pricing assistant. Your purpose is to help grieving families understand funeral pricing, their legal rights, and compare options in their area.

IMPORTANT LEGAL CONTEXT:
- The FTC Funeral Rule (16 C.F.R. Part 453) requires funeral homes to give anyone who asks a General Price List (GPL) — they CANNOT refuse.
- Families can provide their own casket (purchased online) and the funeral home must accept it.
- Embalming is NOT legally required in most states and is rarely necessary.
- You can legally decline services you don't want.

CURRENT FUNERAL HOME PRICE DATA:
${priceContext}

GUIDELINES:
- Be empathetic and gentle — users may be grieving.
- Give concrete price comparisons when data is available.
- Highlight the cheapest options clearly.
- Warn families about common upsells (unnecessary embalming, expensive caskets, etc.).
- If pricing data is unavailable, suggest calling and requesting the GPL by name.
- Always mention that the FTC Funeral Rule gives them the right to get itemized pricing.
- Keep responses concise and scannable with bullet points.`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
