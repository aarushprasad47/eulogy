/**
 * Polls Gmail IMAP inbox for GPL replies, parses pricing data,
 * and stores extracted services in MongoDB.
 *
 * Run once:  npx tsx --env-file=.env.local scripts/check-replies.ts
 * Poll loop: npx tsx --env-file=.env.local scripts/check-replies.ts --watch
 */

import { MongoClient, ObjectId } from "mongodb";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import pdfParse = require("pdf-parse");
import nodemailer from "nodemailer";

const mongo = new MongoClient(process.env.MONGODB_URI!);
const db = () => mongo.db();

// ── Helpers ────────────────────────────────────────────────────────────────

function mkid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

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

// ── Regex-based price extraction ───────────────────────────────────────────

function extractPricesWithRegex(text: string): ParsedService[] {
  const services: ParsedService[] = [];
  const seen = new Set<string>();
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 200) continue;

    const rangeMatch = trimmed.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
    const singleMatch = trimmed.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
    if (!rangeMatch && !singleMatch) continue;

    const name = trimmed
      .replace(/\$[\s0-9,.\-–—]+/g, "")
      .replace(/\.{2,}/g, "")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 120);

    if (name.length < 4 || seen.has(name)) continue;

    const funeral = ["cremat", "burial", "funeral", "casket", "urn", "embalm",
                     "transfer", "service", "hearse", "limo", "viewing", "grave",
                     "basic", "prepar", "vault", "receiv", "forward", "remain",
                     "dressing", "disposition"];
    if (!funeral.some(k => name.toLowerCase().includes(k))) continue;

    seen.add(name);

    if (rangeMatch) {
      services.push({ name, price: null,
        priceMin: parseFloat(rangeMatch[1].replace(/,/g, "")),
        priceMax: parseFloat(rangeMatch[2].replace(/,/g, "")) });
    } else if (singleMatch) {
      services.push({ name,
        price: parseFloat(singleMatch[1].replace(/,/g, "")),
        priceMin: null, priceMax: null });
    }
  }

  return services.slice(0, 50);
}

// ── PDF text extraction ────────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try { return (await pdfParse(buffer)).text || ""; }
  catch { return ""; }
}

// ── Match reply to a GplRequest in MongoDB ─────────────────────────────────

async function findGplRequest(fromEmail: string, subject: string, inReplyTo: string | null) {
  const col = db().collection("GplRequest");

  if (inReplyTo) {
    const row = await col.findOne({ notes: inReplyTo });
    if (row) return row;
  }

  const refMatch = subject.match(/\[Ref:([a-z0-9]+)\]/i);
  if (refMatch) {
    const row = await col.findOne({ _id: refMatch[1] as any });
    if (row) return row;
  }

  // Match by sender email (any status)
  const row = await col.findOne(
    { emailAddress: fromEmail },
    { sort: { emailSentAt: -1 } }
  );
  return row;
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

  const reqId = req._id;
  const funeralHomeId = req.funeralHomeId as string;

  const homeDoc = await db().collection("FuneralHome").findOne({ _id: funeralHomeId as any });
  const homeName = (homeDoc?.name as string) || "Unknown";
  console.log(`    → Matched: ${homeName}`);

  let services: ParsedService[] = [];

  for (const att of mail.attachments || []) {
    const mime = att.contentType.toLowerCase();
    const filename = att.filename?.toLowerCase() || "";

    if (mime.includes("pdf") || filename.endsWith(".pdf")) {
      console.log(`    Parsing PDF: ${att.filename}`);
      const text = await extractTextFromPdf(att.content);
      services = extractPricesWithRegex(text);
      console.log(`    Regex extracted ${services.length} services from PDF`);
    }

    if (services.length > 0) break;
  }

  // Fallback: regex on body text
  if (services.length === 0 && bodyText.trim().length > 50) {
    services = extractPricesWithRegex(bodyText);
    if (services.length > 0) console.log(`    Regex extracted ${services.length} services from body`);
  }

  if (services.length === 0) {
    console.log(`    No prices found in this reply.`);
    return false;
  }

  const now = new Date();
  const embeddedServices = services
    .filter(s => s.name && s.name.length <= 200 && (s.price != null || s.priceMin != null))
    .map(s => ({
      id: mkid(),
      funeralHomeId,
      category: guessCategory(s.name),
      name: s.name,
      price: s.price,
      priceMin: s.priceMin,
      priceMax: s.priceMax,
      description: null,
      createdAt: now,
    }));

  // Push services into the embedded array
  await db().collection("FuneralHome").updateOne(
    { _id: funeralHomeId as any },
    {
      $push: { services: { $each: embeddedServices } } as any,
      $set: { verified: true, dataSource: "GPL_EMAIL", updatedAt: now },
    }
  );

  await db().collection("GplRequest").updateOne(
    { _id: reqId },
    { $set: { status: "RESPONDED", responseReceivedAt: now } }
  );

  console.log(`    ✓ Stored ${embeddedServices.length} services for ${homeName}`);

  // Send confirmation email back to the submitter
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Eulogy Team" <${process.env.SMTP_USER}>`,
      to: fromEmail,
      subject: `Thank you for submitting your GPL — ${homeName}`,
      html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
  <div style="border-bottom: 2px solid #6b7280; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Eulogy — Funeral Price Transparency</h2>
  </div>
  <p>Thank you for submitting your General Price List.</p>
  <p>We successfully extracted <strong>${embeddedServices.length} service(s)</strong> from your submission for <strong>${homeName}</strong> and added them to our database.</p>
  <p>Families in your area can now compare your prices at:<br>
  <a href="https://eulogy.vercel.app" style="color: #4472A8;">eulogy.vercel.app</a></p>
  <p>Best regards,<br><strong>The Eulogy Team</strong></p>
</div>`,
    });
    console.log(`    ✉ Confirmation sent to ${fromEmail}`);
  } catch (err) {
    console.error(`    ✗ Could not send confirmation:`, err);
  }

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
      const inReplyTo = (msg.envelope as any).inReplyTo || null;

      const hasRef = /\[Ref:[a-z0-9]+\]/i.test(subject) || !!inReplyTo;
      if (!hasRef) {
        const row = await db().collection("GplRequest").findOne({ emailAddress: fromEmail });
        if (!row) continue;
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
  await mongo.connect();

  const watchMode = process.argv.includes("--watch");

  if (watchMode) {
    const INTERVAL = 60 * 1000; // poll every 60s during demo
    console.log(`Watch mode: polling inbox every 60 seconds...\n`);
    while (true) {
      try { await checkInbox(); } catch (err) { console.error("Poll error:", err); }
      await new Promise(r => setTimeout(r, INTERVAL));
    }
  } else {
    await checkInbox();
  }

  const homes = await db().collection("FuneralHome").countDocuments();
  const gplSent = await db().collection("GplRequest").countDocuments({ status: "SENT" });
  const gplResponded = await db().collection("GplRequest").countDocuments({ status: "RESPONDED" });
  console.log(`\nDB: ${homes} homes, ${gplSent} GPL sent, ${gplResponded} responded`);

  await mongo.close();
}

main().catch(console.error);
