import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function detectLocation(messages: { role: string; content: string }[]): string | null {
  const text = messages.slice(-4).map((m) => m.content).join(" ");
  const zip = text.match(/\b(\d{5})\b/)?.[1];
  if (zip) return zip;
  const city = text.match(/\b(?:in|near|around|from)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/)?.[1];
  if (city) return city;
  return null;
}

async function fetchHomes(location: string | null) {
  if (!location) {
    return prisma.funeralHome.findMany({
      include: { services: { take: 10 } },
      where: { services: { some: {} } },
      orderBy: { name: "asc" },
      take: 5,
    });
  }
  return prisma.funeralHome.findMany({
    include: { services: { take: 10 } },
    where: {
      OR: [
        { city: { contains: location } },
        { state: { contains: location } },
        { zip: location },
        { name: { contains: location } },
      ],
    },
    take: 5,
  });
}

function buildPriceContext(homes: Awaited<ReturnType<typeof fetchHomes>>, location: string | null) {
  if (homes.length === 0) return "No funeral home price data found for this location yet.";
  const header = `Price data for ${location ?? "your area"}:`;
  const body = homes.map((h) => {
    const lines = [`${h.name} — ${h.city}, ${h.state} ${h.zip}`];
    if (h.phone) lines.push(`Phone: ${h.phone}`);
    if (h.services.length === 0) {
      lines.push("Pricing not yet available.");
    } else {
      h.services.slice(0, 10).forEach((s) => {
        const p =
          s.price != null ? `$${s.price.toLocaleString()}`
          : s.priceMin != null ? `$${s.priceMin.toLocaleString()}–$${s.priceMax?.toLocaleString()}`
          : "call for pricing";
        lines.push(`  - ${s.name}: ${p}`);
      });
    }
    return lines.join("\n");
  }).join("\n\n");
  return `${header}\n\n${body}`;
}

function streamError(message: string) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(message));
        controller.close();
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

export async function POST(request: NextRequest) {
  const { messages, location: propLocation } = await request.json();

  const location = propLocation || detectLocation(messages);
  const homes = await fetchHomes(location);
  const priceContext = buildPriceContext(homes, location);

  const systemPrompt = `You are Eulogy's compassionate pricing assistant. Help grieving families understand funeral costs and their rights.

KEY LEGAL FACTS:
- The FTC Funeral Rule requires funeral homes to provide a General Price List (GPL) to anyone who asks — they cannot refuse.
- Families can supply their own casket and the funeral home must accept it.
- Embalming is NOT legally required in most states.
- You can decline any service you don't want.

${priceContext}

RESPONSE RULES:
- Be warm, brief, and scannable. Use bullet points.
- Highlight the cheapest option when comparing prices.
- Warn about common upsells (unnecessary embalming, expensive caskets).
- If no price data exists for their area, tell them to call and ask for the GPL by name.`;

  // Keep last 6 messages, ensure history starts with user role
  const recent = messages.slice(-6);
  const firstUserIdx = recent.findIndex((m: { role: string }) => m.role === "user");
  const history = (firstUserIdx === -1 ? [] : recent.slice(firstUserIdx)).map(
    (m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })
  );

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...history],
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("rate limit")) {
      return streamError(
        "I'm at my usage limit right now.\n\n" +
        "In the meantime:\n" +
        "• Browse the **Compare** page to see prices side-by-side\n" +
        "• Call any funeral home and ask for their **General Price List** — they must provide it under the FTC Funeral Rule\n" +
        "• Direct cremation typically runs **$700–$2,500** depending on your area\n\n" +
        "Try again in a few minutes!"
      );
    }
    return streamError("Sorry, something went wrong. Please try again in a moment.");
  }
}
