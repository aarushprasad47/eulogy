import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  // Gemini requires history to start with a user message and alternate user/model.
  // Drop any leading assistant messages (e.g. the UI greeting) and the final user message.
  const prior = messages.slice(0, -1).filter(
    (m: { role: string }) => m.role === "user" || m.role === "assistant"
  );

  // Find the first user message index so history starts with user
  const firstUserIdx = prior.findIndex((m: { role: string }) => m.role === "user");
  const validHistory = firstUserIdx === -1 ? [] : prior.slice(firstUserIdx);

  const history = validHistory.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  try {
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(encoder.encode(text));
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI error";
    return Response.json({ error: message }, { status: 500 });
  }
}
