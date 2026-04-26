import { NextRequest } from "next/server";
import { MongoClient } from "mongodb";
import Groq from "groq-sdk";
import crypto from "crypto";

const mongo = new MongoClient(process.env.MONGODB_URI!);
const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });

function mkid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 11); }

function guessCategory(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("basic service")) return "BASIC_SERVICES";
  if (l.includes("direct cremat") || l.includes("cremat")) return "DIRECT_CREMATION";
  if (l.includes("immediate burial")) return "IMMEDIATE_BURIAL";
  if (l.includes("forward")) return "FORWARDING_REMAINS";
  if (l.includes("receiv")) return "RECEIVING_REMAINS";
  if (l.includes("full funeral") || l.includes("traditional")) return "FULL_FUNERAL_SERVICE";
  if (l.includes("graveside")) return "GRAVESIDE_SERVICE";
  if (l.includes("transfer")) return "TRANSFER_OF_REMAINS";
  if (l.includes("embalm")) return "EMBALMING";
  if (l.includes("prepar") || l.includes("dressing")) return "BODY_PREPARATION";
  if (l.includes("viewing") || l.includes("visitation")) return "VIEWING_FACILITIES";
  if (l.includes("hearse")) return "HEARSE";
  if (l.includes("casket") || l.includes("coffin")) return "CASKET";
  if (l.includes("urn")) return "URN";
  if (l.includes("vault") || l.includes("burial container")) return "OUTER_BURIAL_CONTAINER";
  return "OTHER";
}

async function extractPricesFromTranscript(transcript: string): Promise<
  { name: string; price: number | null; priceMin: number | null; priceMax: number | null }[]
> {
  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 512,
    messages: [
      {
        role: "system",
        content: `You extract funeral home pricing data from call transcripts.
Return ONLY a valid JSON array. Each item: {"name":"service name","price":number|null,"priceMin":number|null,"priceMax":number|null}.
Use price for exact amounts, priceMin+priceMax for ranges, null if not mentioned.
Strip dollar signs and commas from numbers. Only include services where a price was actually stated.
JSON only — no markdown, no explanation.`,
      },
      {
        role: "user",
        content: `Extract all funeral service prices from this transcript:\n\n${transcript}`,
      },
    ],
  });

  try {
    const raw = chat.choices[0].message.content?.trim() || "[]";
    const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  // ElevenLabs sends: t=<timestamp>,v1=<hmac>
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sig = request.headers.get("elevenlabs-signature");
    if (!verifySignature(rawBody, sig, webhookSecret)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const body = JSON.parse(rawBody);

  // ElevenLabs sends different event types — only process post-call summary
  const eventType = body.type || body.event_type;
  if (eventType && eventType !== "conversation_ended" && eventType !== "post_call_transcription") {
    return Response.json({ received: true });
  }

  // Extract transcript text
  const transcriptArr: { role: string; message: string }[] =
    body.transcript || body.conversation?.transcript || [];
  const transcriptText = transcriptArr
    .map((t) => `${t.role}: ${t.message}`)
    .join("\n");

  if (!transcriptText.trim()) {
    return Response.json({ received: true, skipped: "empty transcript" });
  }

  // Correlate to funeralHomeId via callSid
  const callSid =
    body.metadata?.twilio_call_sid ||
    body.conversation_initiation_metadata?.twilio_call_sid ||
    body.call_sid || null;

  await mongo.connect();
  const db = mongo.db();

  let funeralHomeId: string | null = null;
  let funeralHomeName: string | null = null;

  if (callSid) {
    const record = await db.collection("CallRecord").findOne({ callSid });
    funeralHomeId   = record?.funeralHomeId   ?? null;
    funeralHomeName = record?.funeralHomeName ?? null;
  }

  // Also check custom parameters passed via TwiML <Stream>
  if (!funeralHomeId) {
    funeralHomeId = body.metadata?.funeral_home_id || null;
  }

  console.log(`[webhook] callSid=${callSid} homeId=${funeralHomeId}`);
  console.log(`[webhook] transcript length: ${transcriptText.length} chars`);

  // Use Groq to extract prices from transcript
  const services = await extractPricesFromTranscript(transcriptText);
  console.log(`[webhook] extracted ${services.length} services`);

  if (services.length > 0 && funeralHomeId) {
    const now = new Date();
    const embedded = services
      .filter((s) => s.name && (s.price != null || s.priceMin != null))
      .map((s) => ({
        id:           mkid(),
        funeralHomeId,
        category:     guessCategory(s.name),
        name:         s.name,
        price:        s.price,
        priceMin:     s.priceMin,
        priceMax:     s.priceMax,
        description:  null,
        createdAt:    now,
      }));

    if (embedded.length > 0) {
      await db.collection("FuneralHome").updateOne(
        { _id: funeralHomeId as any },
        {
          $push: { services: { $each: embedded } } as any,
          $set:  { dataSource: "GPL_CALL", verified: true, updatedAt: now },
        }
      );
      console.log(`[webhook] stored ${embedded.length} services for ${funeralHomeName || funeralHomeId}`);
    }
  }

  // Update call record with outcome
  if (callSid) {
    await db.collection("CallRecord").updateOne(
      { callSid },
      { $set: { status: "completed", servicesExtracted: services.length, updatedAt: new Date() } }
    );
  }

  return Response.json({ received: true, servicesExtracted: services.length });
}
