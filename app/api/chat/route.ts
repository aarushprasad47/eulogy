import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function detectLocation(messages: { role: string; content: string }[]): string | null {
  const text = messages.slice(-6).map((m) => m.content).join(" ");
  // ZIP code
  const zip = text.match(/\b(\d{5})\b/)?.[1];
  if (zip) return zip;
  // "in/near/around/from City" or "City, ST"
  const city = text.match(
    /\b(?:in|near|around|from|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/
  )?.[1];
  if (city) return city;
  // bare "City, ST"
  const cityState = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\b/)?.[0];
  if (cityState) return cityState;
  return null;
}

async function fetchLocalHomes(location: string) {
  // All homes in the area, sorted so priced ones come first
  return prisma.funeralHome.findMany({
    include: { services: { take: 12, orderBy: { price: "asc" } } },
    where: {
      OR: [
        { city: { contains: location } },
        { state: { equals: location.length === 2 ? location.toUpperCase() : undefined } },
        { zip: location },
      ],
    },
    orderBy: [{ services: { _count: "desc" } }, { name: "asc" }],
    take: 8,
  });
}

async function fetchHomesWithPrices() {
  // Fallback: sample of homes that actually have price data
  return prisma.funeralHome.findMany({
    include: { services: { take: 12, orderBy: { price: "asc" } } },
    where: { services: { some: {} } },
    orderBy: { name: "asc" },
    take: 5,
  });
}

function buildPriceContext(
  homes: Awaited<ReturnType<typeof fetchLocalHomes>>,
  location: string | null
): string {
  if (homes.length === 0) return "";
  const label = location ? `Funeral homes in/near "${location}"` : "Sample homes with pricing data";
  const body = homes.map((h) => {
    const parts: string[] = [`• ${h.name} — ${h.city}, ${h.state}`];
    if (h.phone) parts.push(`  Phone: ${h.phone}`);
    if (h.website) parts.push(`  Website: ${h.website}`);
    if (h.services.length === 0) {
      parts.push(`  Pricing: not yet in our database — call to request their GPL`);
    } else {
      h.services.forEach((s) => {
        const p =
          s.price != null ? `$${s.price.toLocaleString()}`
          : s.priceMin != null ? `$${s.priceMin.toLocaleString()}–$${s.priceMax?.toLocaleString()}`
          : "call for pricing";
        parts.push(`  - ${s.name}: ${p}`);
      });
    }
    return parts.join("\n");
  }).join("\n\n");
  return `${label}:\n\n${body}`;
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

  // Fetch relevant homes
  let homes: Awaited<ReturnType<typeof fetchLocalHomes>> = [];
  if (location) {
    homes = await fetchLocalHomes(location);
    // If the location matched nothing, fall back to priced homes as examples
    if (homes.length === 0) {
      homes = await fetchHomesWithPrices();
    }
  } else {
    homes = await fetchHomesWithPrices();
  }

  const priceContext = buildPriceContext(homes, location);

  const systemPrompt = `You are Eulogy's compassionate funeral pricing assistant. You help grieving families find funeral homes in their area, understand costs, and know their legal rights.

DATABASE COVERAGE: Our database has 3,000+ US funeral homes with names, addresses, and phone numbers. Pricing data is available for a growing subset — when a home shows "call to request their GPL," that means pricing isn't in our system yet but the home exists and can be contacted.

KEY LEGAL FACTS:
- The FTC Funeral Rule requires funeral homes to provide a General Price List (GPL) to ANYONE who asks — they cannot legally refuse.
- Families can supply their own casket (bought online) and the funeral home must accept it.
- Embalming is NOT legally required in most US states.
- You can decline any individual service.
- Typical direct cremation: $700–$2,500. Traditional burial: $7,000–$15,000.

${priceContext ? priceContext : "No location set yet — see instructions below."}

BEHAVIOR RULES:
1. If the user hasn't provided a city, state, or ZIP code, ask for it before answering location-based questions. Say something like: "To find funeral homes near you, what city or ZIP code are you in?"
2. If you have local homes (even without pricing), list them with their phone numbers so families can call.
3. For homes without pricing in our database, tell the user to call and specifically ask for the "General Price List" — the funeral home is legally required to provide it.
4. Be warm, brief, and use bullet points.
5. Always highlight the cheapest option when prices are available.
6. Warn about common upsells: unnecessary embalming, overpriced caskets, "package deals" that bundle unwanted services.`;

  // Keep last 6 messages, strip leading assistant messages for the model
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
