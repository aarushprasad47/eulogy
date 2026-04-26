/**
 * One-shot pipeline test:
 *   1. Sends the GPL request email to aarushprasad@hotmail.com
 *   2. Waits 30 seconds
 *   3. Scans Gmail ONCE for replies received AFTER the send time
 *   4. Parses the PDF and writes services to MongoDB
 *
 * Run: npx tsx --env-file=.env.local scripts/pipeline-test.ts
 */

import { MongoClient } from "mongodb";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import pdfParse = require("pdf-parse");
import nodemailer from "nodemailer";

const RECIPIENT = "aarushprasad@hotmail.com";
const HOME_NAME = "Complete Test Funeral Home - #1";

const mongo = new MongoClient(process.env.MONGODB_URI!);

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

function extractPrices(text: string) {
  const services: { name: string; price: number | null; priceMin: number | null; priceMax: number | null }[] = [];
  const seen = new Set<string>();
  const funeral = ["cremat", "burial", "funeral", "casket", "urn", "embalm",
                   "transfer", "service", "hearse", "limo", "viewing", "grave",
                   "basic", "prepar", "vault", "receiv", "forward", "remain",
                   "dressing", "disposition"];

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const t = line.trim();
    if (t.length < 5 || t.length > 200) continue;

    const range = t.match(/\$([0-9,]+)\s*[-–—]\s*\$([0-9,]+)/);
    const single = t.match(/\$\s*([0-9,]+(?:\.[0-9]{2})?)/);
    if (!range && !single) continue;

    const name = t.replace(/\$[\s0-9,.\-–—]+/g, "").replace(/\.{2,}/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 120);
    if (name.length < 4 || seen.has(name)) continue;
    if (!funeral.some(k => name.toLowerCase().includes(k))) continue;
    seen.add(name);

    if (range) {
      services.push({ name, price: null, priceMin: parseFloat(range[1].replace(/,/g, "")), priceMax: parseFloat(range[2].replace(/,/g, "")) });
    } else if (single) {
      services.push({ name, price: parseFloat(single[1].replace(/,/g, "")), priceMin: null, priceMax: null });
    }
  }
  return services.slice(0, 50);
}

// ── Step 1: Send email ──────────────────────────────────────────────────────

async function sendEmail(): Promise<Date> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: `"Eulogy Team" <${process.env.SMTP_USER}>`,
    to: RECIPIENT,
    subject: `Request for General Price List — ${HOME_NAME}`,
    html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
  <div style="border-bottom: 2px solid #6b7280; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Eulogy — Funeral Price Transparency</h2>
  </div>
  <p>Dear ${HOME_NAME} Staff,</p>
  <p>Please <strong>reply to this email</strong> with your General Price List as a <strong>PDF attachment</strong>.</p>
  <p>We are Eulogy, a nonprofit transparency platform helping families compare funeral prices.</p>
  <p>Best regards,<br><strong>The Eulogy Team</strong><br>
  <a href="https://eulogy.vercel.app" style="color: #4472A8;">eulogy.vercel.app</a></p>
</div>`,
  });

  const sendTime = new Date();
  console.log(`✓ Email sent to ${RECIPIENT} at ${sendTime.toISOString()}`);
  return sendTime;
}

// ── Step 2: Wait ────────────────────────────────────────────────────────────

function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    let remaining = Math.ceil(ms / 1000);
    const interval = setInterval(() => {
      process.stdout.write(`\r  Waiting ${remaining}s for your reply...   `);
      remaining--;
      if (remaining < 0) {
        clearInterval(interval);
        process.stdout.write("\n");
        resolve();
      }
    }, 1000);
  });
}

// ── Step 3: Scan Gmail for replies received after sendTime ─────────────────

async function scanOnce(sendTime: Date): Promise<boolean> {
  const db = mongo.db();
  const req = await db.collection("GplRequest").findOne({ emailAddress: RECIPIENT });
  if (!req) { console.error("No GplRequest found for", RECIPIENT); return false; }

  const imap = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    logger: false,
  });

  await imap.connect();
  const lock = await imap.getMailboxLock("INBOX");

  try {
    // Fetch emails since today — then filter by exact internalDate > sendTime
    const since = new Date(sendTime);
    since.setHours(0, 0, 0, 0);

    let found = false;

    for await (const msg of imap.fetch({ since }, { envelope: true, source: true, internalDate: true })) {
      const from = msg.envelope.from?.[0]?.address?.toLowerCase() || "";
      if (from !== RECIPIENT.toLowerCase()) continue;

      // Only emails that arrived AFTER we sent ours
      const arrived = (msg as any).internalDate as Date | undefined;
      if (arrived && arrived <= sendTime) {
        console.log(`  Skipping old email from ${arrived.toISOString()}`);
        continue;
      }

      const subject = msg.envelope.subject || "";
      console.log(`  Found new reply: "${subject.slice(0, 60)}" (arrived ${arrived?.toISOString()})`);

      const mail = await simpleParser(msg.source!);
      let services: ReturnType<typeof extractPrices> = [];

      for (const att of mail.attachments || []) {
        const mime = att.contentType.toLowerCase();
        if (mime.includes("pdf") || att.filename?.toLowerCase().endsWith(".pdf")) {
          console.log(`  Parsing PDF: ${att.filename}`);
          const result = await pdfParse(att.content);
          services = extractPrices(result.text || "");
          console.log(`  Extracted ${services.length} services from PDF`);
          break;
        }
      }

      if (services.length === 0 && (mail.text || "").length > 50) {
        services = extractPrices(mail.text || "");
        if (services.length > 0) console.log(`  Extracted ${services.length} services from email body`);
      }

      if (services.length === 0) {
        console.log("  No prices found in reply.");
        continue;
      }

      const now = new Date();
      const funeralHomeId = req.funeralHomeId as string;
      const embedded = services
        .filter(s => s.price != null || s.priceMin != null)
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

      await db.collection("FuneralHome").updateOne(
        { _id: funeralHomeId as any },
        {
          $push: { services: { $each: embedded } } as any,
          $set: { verified: true, dataSource: "GPL_EMAIL", updatedAt: now },
        }
      );
      await db.collection("GplRequest").updateOne(
        { _id: req._id },
        { $set: { status: "RESPONDED", responseReceivedAt: now } }
      );

      console.log(`✓ Stored ${embedded.length} services for ${HOME_NAME}`);

      // Send confirmation email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"Eulogy Team" <${process.env.SMTP_USER}>`,
        to: RECIPIENT,
        subject: `Thank you for submitting your GPL — ${HOME_NAME}`,
        html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
  <h2 style="border-bottom: 2px solid #6b7280; padding-bottom: 16px;">Eulogy — Thank You</h2>
  <p>Thank you for submitting your General Price List.</p>
  <p>We extracted <strong>${embedded.length} service(s)</strong> from your submission and added them to our database.</p>
  <p>View your listing: <a href="https://eulogy.vercel.app/homes/${funeralHomeId}">eulogy.vercel.app/homes/${funeralHomeId}</a></p>
  <p>Best regards,<br><strong>The Eulogy Team</strong></p>
</div>`,
      });
      console.log(`✉ Confirmation sent to ${RECIPIENT}`);
      found = true;
      break;
    }

    if (!found) console.log("  No new replies found within the window.");
    return found;
  } finally {
    lock.release();
    await imap.logout();
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  await mongo.connect();
  const sendTime = await sendEmail();
  console.log("\nReply to that email with your GPL PDF now. You have 30 seconds.\n");
  await wait(30000);
  console.log("\nScanning Gmail for your reply...");
  await scanOnce(sendTime);
  await mongo.close();
}

main().catch(console.error);
