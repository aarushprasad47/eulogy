import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Pull location hints from recent messages
function detectLocation(messages: { role: string; content: string }[]): string | null {
  const text = messages
    .slice(-4)
    .map((m) => m.content)
    .join(" ");
  // ZIP code
  const zip = text.match(/\b(\d{5})\b/)?.[1];
  if (zip) return zip;
  // "in [City]" / "near [City]" / "I'm in [City, ST]"
  const city = text.match(/\b(?:in|near|around|from)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/)?.[1];
  if (city) return city;
  return null;
}

function buildPriceContext(homes: Awaited<ReturnType<typeof fetchHomes>>) {
  if (homes.length === 0) return "No funeral home price data found for this location yet.";
  return homes
    .map((h) => {
      const lines = [`**${h.name}** — ${h.city}, ${h.state} ${h.zip}`];
      if (h.phone) lines.push(`Phone: ${h.phone}`);
      if (h.services.length === 0) {
        lines.push("Services: pricing not yet available");
      } else {
        const svcLines = h.services.slice(0, 10).map((s) => {
          const p =
            s.price != null
              ? `$${s.price.toLocaleString()}`
              : s.priceMin != null
              ? `$${s.priceMin.toLocaleString()}–$${s.priceMax?.toLocaleString()}`
              : "call for pricing";
          return `  - ${s.name}: ${p}`;
        });
        lines.push("Services:\n" + svcLines.join("\n"));
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

async function fetchHomes(location: string | null) {
  if (!location) {
    // No location: return homes with the most services as examples
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

// Stream an error message to the client instead of returning JSON
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
  const priceContext = buildPriceContext(homes);

  const systemPrompt = `You are Eulogy's compassionate pricing assistant. Help grieving families understand funeral costs and their rights.

KEY LEGAL FACTS:
- The FTC Funeral Rule requires funeral homes to provide a General Price List (GPL) to anyone who asks — they cannot refuse.
- Families can supply their own casket (bought online) and the funeral home must accept it.
- Embalming is NOT legally required in most states.
- You can decline any service you don't want.

PRICE DATA FOR ${location ? location.toUpperCase() : "YOUR AREA"}:
${priceContext}

RESPONSE RULES:
- Be warm, brief, and scannable (use bullet points).
- If the user mentions a city or ZIP, acknowledge you're showing data for that area.
- Highlight the cheapest option when comparing.
- Warn about common upsells (unnecessary embalming, expensive caskets).
- If no price data exists for their area, tell them to call and ask for the GPL by name.`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  // Only keep last 6 messages to limit token use; strip leading assistant messages for Gemini
  const recent = messages.slice(-6);
  const firstUserIdx = recent.findIndex((m: { role: string }) => m.role === "user");
  const prior = firstUserIdx === -1 ? [] : recent.slice(firstUserIdx, -1);

  const history = prior.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        },
      }),
      { headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") || msg.includes("quota")) {
      return streamError(
        "I've reached my usage limit for now — the free tier resets daily. " +
        "In the meantime, you can:\n\n" +
        "• Browse funeral homes directly on the **Compare** page\n" +
        "• Call any home and ask for their **General Price List** by name (they must provide it under the FTC Funeral Rule)\n" +
        "• Direct cremation typically runs **$700–$2,500** depending on your area\n\n" +
        "Try again in a few hours and I'll be back!"
      );
    }
    return streamError("Sorry, something went wrong. Please try again in a moment.");
  }
}
