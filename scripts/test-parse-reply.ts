/**
 * Tests the reply parser against the actual Gmail inbox.
 * Finds the most recent reply from aarushprasad@hotmail.com,
 * extracts pricing data from any attachments (PDF or image), and prints results.
 * Does NOT write to the database.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-parse-reply.ts
 */

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import pdfParse = require("pdf-parse");
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

interface ParsedService {
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

async function callGeminiWithRetry(fn: () => Promise<ParsedService[]>): Promise<ParsedService[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const retryMatch = msg.match(/retry in (\d+)s/i);
      if (retryMatch && attempt < 2) {
        const wait = (parseInt(retryMatch[1]) + 2) * 1000;
        console.log(`  Gemini quota hit, retrying in ${retryMatch[1]}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
  return [];
}

function extractPricesFromText(text: string): ParsedService[] {
  const services: ParsedService[] = [];
  const seen = new Set<string>();
  const funeral = ["cremat", "burial", "funeral", "casket", "urn", "embalm",
                   "transfer", "service", "hearse", "limo", "viewing", "grave",
                   "basic", "prepar", "vault", "receiv", "forward", "remain",
                   "dressing", "disposition"];

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 200) continue;

    const rangeMatch = trimmed.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
    const singleMatch = trimmed.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
    if (!rangeMatch && !singleMatch) continue;

    const name = trimmed
      .replace(/\$[\s0-9,.\-–—]+/g, "")
      .replace(/\.{2,}/g, "")
      .replace(/\s{2,}/g, " ")
      .trim().slice(0, 120);

    if (name.length < 4 || seen.has(name)) continue;
    if (!funeral.some(k => name.toLowerCase().includes(k))) continue;

    seen.add(name);
    if (rangeMatch) {
      services.push({ name, price: null,
        priceMin: parseFloat(rangeMatch[1].replace(/,/g, "")),
        priceMax: parseFloat(rangeMatch[2].replace(/,/g, "")) });
    } else if (singleMatch) {
      services.push({ name, price: parseFloat(singleMatch[1].replace(/,/g, "")), priceMin: null, priceMax: null });
    }
  }
  return services.slice(0, 50);
}

async function extractPricesFromImage(imageBuffer: Buffer, mimeType: string): Promise<ParsedService[]> {
  return callGeminiWithRetry(async () => {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `This is a funeral home General Price List (GPL). Extract every service and its price.
Return ONLY a valid JSON array where each item has:
- "name": service name (string)
- "price": single price as number, or null if it's a range
- "priceMin": minimum of range as number, or null
- "priceMax": maximum of range as number, or null

Only include items with a dollar amount. Strip $ and commas from numbers.
Respond with ONLY the JSON array.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
    ]);
    const raw = result.response.text().trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    return JSON.parse(raw) as ParsedService[];
  });
}

async function main() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP_USER and SMTP_PASS must be set");
    process.exit(1);
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  });

  await client.connect();
  console.log("Connected to Gmail IMAP.\n");

  const lock = await client.getMailboxLock("INBOX");

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // Collect all recent messages, pick latest from hotmail
    let latestSource: Buffer | null = null;

    for await (const msg of client.fetch({ since }, { envelope: true, source: true })) {
      const from = msg.envelope.from?.[0]?.address?.toLowerCase() || "";
      if (from.includes("hotmail") || from.includes("aarushprasad")) {
        latestSource = msg.source;
      }
    }

    if (!latestSource) {
      console.log("No reply found from aarushprasad@hotmail.com yet.");
      return;
    }

    // Use mailparser for proper MIME decoding
    const parsed = await simpleParser(latestSource);

    console.log(`From:    ${parsed.from?.text}`);
    console.log(`Subject: ${parsed.subject}`);
    console.log(`Date:    ${parsed.date}\n`);

    // Show body preview
    const bodyText = parsed.text || "";
    if (bodyText.trim()) {
      console.log("Body preview:");
      console.log(bodyText.slice(0, 300).trim());
      console.log("...\n");
    }

    // List attachments
    const attachments = parsed.attachments || [];
    if (attachments.length > 0) {
      console.log(`Attachments (${attachments.length}):`);
      for (const a of attachments) {
        console.log(`  - ${a.filename || "unnamed"} [${a.contentType}] ${Math.round((a.size || 0) / 1024)}KB`);
      }
      console.log();
    } else {
      console.log("No attachments found.\n");
    }

    // ── Parse attachments ──────────────────────────────────────────────────
    let services: ParsedService[] = [];

    for (const att of attachments) {
      const mime = att.contentType.toLowerCase();
      const filename = att.filename?.toLowerCase() || "";
      const buf = att.content;

      if (mime.includes("pdf") || filename.endsWith(".pdf")) {
        console.log(`Extracting text from PDF: ${att.filename}`);
        const pdfText = (await pdfParse(buf)).text;
        console.log(`PDF text preview: ${pdfText.slice(0, 200).trim()}...\n`);
        services = extractPricesFromText(pdfText);
        console.log(`Regex extracted ${services.length} services from PDF`);
      } else if (mime.startsWith("image/")) {
        console.log(`Sending image to Gemini Vision: ${att.filename || mime}`);
        services = await extractPricesFromImage(buf, mime);
      }

      if (services.length > 0) break; // stop after first successful parse
    }

    // Fallback to body text
    if (services.length === 0 && bodyText.trim().length > 50) {
      console.log("No attachment prices found, trying body text...");
      services = extractPricesFromText(bodyText);
    }

    // ── Print results ──────────────────────────────────────────────────────
    console.log(`${"─".repeat(55)}`);
    console.log(`Extracted ${services.length} services:\n`);

    for (const s of services) {
      const priceStr = s.price != null
        ? `$${s.price.toLocaleString()}`
        : s.priceMin != null
        ? `$${s.priceMin.toLocaleString()} – $${s.priceMax?.toLocaleString()}`
        : "price unknown";
      console.log(`  ${s.name.slice(0, 45).padEnd(45)} ${priceStr}`);
    }

    if (services.length > 0) {
      console.log(`\n✓ Parser working. The full pipeline (check-replies.ts) will store these in the DB.`);
    } else {
      console.log("\nNo prices extracted.");
    }
  } finally {
    lock.release();
    await client.logout();
  }
}

main().catch(console.error);
