/**
 * Polls Gmail IMAP inbox for GPL replies, parses pricing data,
 * and stores extracted services in the database.
 *
 * Strategy:
 *   - PDF / plain-text replies → regex price extraction (no AI, no quota)
 *   - Image attachments        → Gemini Vision (fallback, only when needed)
 *
 * Run once:  npx tsx --env-file=.env.local scripts/check-replies.ts
 * Poll loop: npx tsx --env-file=.env.local scripts/check-replies.ts --watch
 */

import { createClient } from "@libsql/client";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import pdfParse = require("pdf-parse");
import { GoogleGenerativeAI } from "@google/generative-ai";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// ── Helpers ────────────────────────────────────────────────────────────────

function cuid(): string {
  return "gpl" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function guessCategory(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("basic service")) return "BASIC_SERVICES";
  if (l.includes("direct cremat")) return "DIRECT_CREMATION";
  if (l.includes("cremat")) return "DIRECT_CREMATION";
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
  if (l.includes("limo")) return "LIMOUSINE";
  if (l.includes("casket") || l.includes("coffin")) return "CASKET";
  if (l.includes("urn")) return "URN";
  if (l.includes("vault") || l.includes("burial container")) return "OUTER_BURIAL_CONTAINER";
  return "OTHER";
}

interface ParsedService {
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
}

// ── Regex-based price extraction (no AI required) ──────────────────────────

function extractPricesWithRegex(text: string): ParsedService[] {
  const services: ParsedService[] = [];
  const seen = new Set<string>();

  // Normalize whitespace and split into lines
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 200) continue;

    // Look for lines containing a dollar amount
    const rangeMatch = trimmed.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
    const singleMatch = trimmed.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
    if (!rangeMatch && !singleMatch) continue;

    // Extract the name by stripping the price portion
    const name = trimmed
      .replace(/\$[\s0-9,.\-–—]+/g, "")
      .replace(/\.{2,}/g, "") // strip dot leaders (........$1,234)
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 120);

    if (name.length < 4 || seen.has(name)) continue;

    // Require at least one funeral-related keyword (reduces noise)
    const funeral = ["cremat", "burial", "funeral", "casket", "urn", "embalm",
                     "transfer", "service", "hearse", "limo", "viewing", "grave",
                     "basic", "prepar", "vault", "receiv", "forward", "remain",
                     "dressing", "disposition"];
    if (!funeral.some(k => name.toLowerCase().includes(k))) continue;

    seen.add(name);

    if (rangeMatch) {
      services.push({
        name,
        price: null,
        priceMin: parseFloat(rangeMatch[1].replace(/,/g, "")),
        priceMax: parseFloat(rangeMatch[2].replace(/,/g, "")),
      });
    } else if (singleMatch) {
      services.push({
        name,
        price: parseFloat(singleMatch[1].replace(/,/g, "")),
        priceMin: null,
        priceMax: null,
      });
    }
  }

  return services.slice(0, 50);
}

// ── Gemini Vision for image attachments (fallback only) ───────────────────

async function extractPricesFromImage(buf: Buffer, mimeType: string): Promise<ParsedService[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `This is a funeral home General Price List. Extract every service and its price.
Return ONLY a valid JSON array. Each item: {"name":"...","price":number|null,"priceMin":number|null,"priceMax":number|null}.
Use priceMin/priceMax for ranges, price for single values. Strip $ and commas. JSON only, no markdown.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buf.toString("base64"), mimeType } },
    ]);
    const raw = result.response.text().trim().replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(raw) as ParsedService[];
    return Array.isArray(parsed) ? parsed.slice(0, 50) : [];
  } catch {
    return [];
  }
}

// ── PDF text extraction ────────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    return (await pdfParse(buffer)).text || "";
  } catch {
    return "";
  }
}

// ── Match reply to a GplRequest ────────────────────────────────────────────

async function findGplRequest(fromEmail: string, subject: string, inReplyTo: string | null) {
  // 1. By In-Reply-To header (stored as Message-ID in notes column)
  if (inReplyTo) {
    const row = await db.execute({
      sql: "SELECT * FROM GplRequest WHERE notes=? LIMIT 1",
      args: [inReplyTo],
    });
    if (row.rows.length > 0) return row.rows[0];
  }

  // 2. By [Ref:ID] in subject
  const refMatch = subject.match(/\[Ref:([a-z0-9]+)\]/i);
  if (refMatch) {
    const row = await db.execute({
      sql: "SELECT * FROM GplRequest WHERE id=? LIMIT 1",
      args: [refMatch[1]],
    });
    if (row.rows.length > 0) return row.rows[0];
  }

  // 3. By sender email
  const row = await db.execute({
    sql: "SELECT * FROM GplRequest WHERE emailAddress=? AND status='SENT' ORDER BY emailSentAt DESC LIMIT 1",
    args: [fromEmail],
  });
  if (row.rows.length > 0) return row.rows[0];

  return null;
}

// ── Process a single reply ─────────────────────────────────────────────────

async function processReply(source: Buffer): Promise<boolean> {
  const mail = await simpleParser(source);

  const fromEmail = mail.from?.value?.[0]?.address?.toLowerCase() || "";
  const subject = mail.subject || "";
  const inReplyTo = mail.inReplyTo || null;
  const bodyText = mail.text || "";

  const req = await findGplRequest(fromEmail, subject, inReplyTo);
  if (!req) {
    console.log(`    ? No matching GPL request for ${fromEmail}`);
    return false;
  }

  const reqId = req.id as string;
  const funeralHomeId = req.funeralHomeId as string;

  const homeRow = await db.execute({
    sql: "SELECT name FROM FuneralHome WHERE id=?",
    args: [funeralHomeId],
  });
  const homeName = (homeRow.rows[0]?.name as string) || "Unknown";
  console.log(`    → Matched: ${homeName}`);

  let services: ParsedService[] = [];

  // Process attachments
  for (const att of mail.attachments || []) {
    const mime = att.contentType.toLowerCase();
    const filename = att.filename?.toLowerCase() || "";

    if (mime.includes("pdf") || filename.endsWith(".pdf")) {
      console.log(`    Parsing PDF: ${att.filename}`);
      const text = await extractTextFromPdf(att.content);
      services = extractPricesWithRegex(text);
      console.log(`    Regex extracted ${services.length} services from PDF`);
    } else if (mime.startsWith("image/")) {
      console.log(`    Parsing image with Gemini Vision: ${att.filename || mime}`);
      services = await extractPricesFromImage(att.content, mime);
      console.log(`    Gemini extracted ${services.length} services from image`);
    }

    if (services.length > 0) break;
  }

  // Fallback: regex on email body text
  if (services.length === 0 && bodyText.trim().length > 50) {
    services = extractPricesWithRegex(bodyText);
    if (services.length > 0) console.log(`    Regex extracted ${services.length} services from body text`);
  }

  if (services.length === 0) {
    console.log(`    No prices found in this reply.`);
    return false;
  }

  const now = new Date().toISOString();

  for (const s of services) {
    if (!s.name || s.name.length > 200) continue;
    if (s.price == null && s.priceMin == null) continue;

    await db.execute({
      sql: `INSERT OR IGNORE INTO Service
              (id, funeralHomeId, category, name, price, priceMin, priceMax, description, createdAt)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [cuid(), funeralHomeId, guessCategory(s.name), s.name, s.price, s.priceMin, s.priceMax, null, now],
    });
  }

  await db.execute({
    sql: "UPDATE GplRequest SET status='RESPONDED', responseReceivedAt=? WHERE id=?",
    args: [now, reqId],
  });
  await db.execute({
    sql: "UPDATE FuneralHome SET verified=1, dataSource='GPL_EMAIL', updatedAt=? WHERE id=?",
    args: [now, funeralHomeId],
  });

  console.log(`    ✓ Stored ${services.length} services for ${homeName}`);
  return true;
}

// ── IMAP polling ───────────────────────────────────────────────────────────

async function checkInbox() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("ERROR: SMTP_USER and SMTP_PASS must be set in .env.local");
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
  const lock = await client.getMailboxLock("INBOX");

  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    let checked = 0;
    let processed = 0;

    for await (const msg of client.fetch({ since }, { envelope: true, source: true })) {
      const fromEmail = msg.envelope.from?.[0]?.address?.toLowerCase() || "";
      if (fromEmail === process.env.SMTP_USER?.toLowerCase()) continue;

      const subject = msg.envelope.subject || "";
      const inReplyTo = msg.envelope.inReplyTo || null;

      // Pre-filter: only process emails that look like replies to us
      const hasRef = /\[Ref:[a-z0-9]+\]/i.test(subject) || !!inReplyTo;
      if (!hasRef) {
        const match = await db.execute({
          sql: "SELECT id FROM GplRequest WHERE emailAddress=? LIMIT 1",
          args: [fromEmail],
        });
        if (match.rows.length === 0) continue;
      }

      checked++;
      console.log(`  Processing: "${subject.slice(0, 60)}" from ${fromEmail}`);
      const stored = await processReply(msg.source!);
      if (stored) processed++;
    }

    console.log(`\nChecked ${checked} candidate emails, stored data from ${processed}.`);
  } finally {
    lock.release();
    await client.logout();
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const watchMode = process.argv.includes("--watch");

  if (watchMode) {
    const INTERVAL = 5 * 60 * 1000;
    console.log(`Watch mode: polling inbox every 5 minutes...\n`);
    while (true) {
      try { await checkInbox(); } catch (err) { console.error("Poll error:", err); }
      await new Promise(r => setTimeout(r, INTERVAL));
    }
  } else {
    await checkInbox();
  }

  const stats = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM GplRequest WHERE status='SENT') as sent,
      (SELECT COUNT(*) FROM GplRequest WHERE status='RESPONDED') as responded,
      (SELECT COUNT(*) FROM FuneralHome WHERE dataSource='GPL_EMAIL') as verified,
      (SELECT COUNT(*) FROM Service) as services
  `);
  const s = stats.rows[0];
  console.log(`\nDB: ${s.sent} sent, ${s.responded} responded, ${s.verified} verified homes, ${s.services} total services`);
}

main().catch(console.error);
