/**
 * Sends FTC GPL price list request emails to funeral homes.
 * Requires SMTP_USER and SMTP_PASS (Gmail App Password) in .env.local
 * Run: npx tsx --env-file=.env.local scripts/send-gpl-requests.ts [limit] [--dry-run]
 */

import { createClient } from "@libsql/client";
import { createTransport } from "nodemailer";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const DELAY_MS = 2000; // 2s between emails to avoid spam filters
const FROM_NAME = "Eulogy Pricing Research";

function buildEmailBody(homeName: string, city: string, state: string, requestId: string): string {
  return `Dear ${homeName} Team,

I hope this message finds you well. I am reaching out on behalf of Eulogy, a free service that helps families understand funeral pricing in their area.

Under the FTC Funeral Rule (16 C.F.R. Part 453), funeral homes are required to provide a General Price List (GPL) to anyone who requests one in person. We are respectfully asking if you would be willing to share your current General Price List so we can include your pricing information on our platform, helping families in ${city}, ${state} make informed decisions during a difficult time.

You may respond to this email by:
1. Attaching your General Price List (PDF or any format)
2. Pasting your pricing information directly in your reply
3. Providing a link to your online price list

Your pricing information will be displayed on Eulogy (https://eulogy-nu.vercel.app) alongside other funeral homes in your area, with full attribution to your business.

This is completely voluntary — while the FTC Funeral Rule requires in-person disclosure, we appreciate any transparency you choose to share online.

If you have any questions, please don't hesitate to reply to this email.

Thank you for your time and for the important service you provide to families in your community.

Warm regards,
Eulogy Pricing Transparency Project
https://eulogy-nu.vercel.app
[Ref:${requestId}]`;
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => /^\d+$/.test(a)) || "50");
  const dryRun = args.includes("--dry-run");

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("ERROR: SMTP_USER and SMTP_PASS must be set in .env.local");
    console.error("For Gmail: enable 2FA then generate an App Password at myaccount.google.com/apppasswords");
    process.exit(1);
  }

  const transporter = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  if (!dryRun) {
    await transporter.verify();
    console.log("SMTP connection verified.\n");
  }

  // Get homes with emails that haven't been contacted yet
  const rows = await db.execute({
    sql: `SELECT f.id, f.name, f.email, f.city, f.state
          FROM FuneralHome f
          LEFT JOIN GplRequest g ON g.funeralHomeId = f.id
          WHERE f.email IS NOT NULL
            AND g.id IS NULL
            AND f.email NOT LIKE '%example%'
            AND f.email NOT LIKE '%test%'
          LIMIT ?`,
    args: [limit],
  });

  const homes = rows.rows as unknown as {
    id: string; name: string; email: string; city: string; state: string;
  }[];

  console.log(`${dryRun ? "[DRY RUN] " : ""}Sending GPL requests to ${homes.length} homes...\n`);

  let sent = 0;
  let failed = 0;

  for (const h of homes) {
    // Create GplRequest record first to get the ID for the email ref
    const reqId = "gpl" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const now = new Date().toISOString();

    const subject = `GPL Price List Request — ${h.name} [Ref:${reqId}]`;
    const body = buildEmailBody(h.name, h.city, h.state, reqId);

    if (dryRun) {
      console.log(`[DRY RUN] Would send to: ${h.email} (${h.name})`);
      console.log(`  Subject: ${subject}\n`);
      sent++;
      continue;
    }

    try {
      const info = await transporter.sendMail({
        from: `"${FROM_NAME}" <${process.env.SMTP_USER}>`,
        to: h.email,
        subject,
        text: body,
        headers: {
          "X-Eulogy-Request-ID": reqId,
        },
      });

      // Store the request with Message-ID for reply matching
      const messageId = info.messageId || "";
      await db.execute({
        sql: `INSERT INTO GplRequest (id, funeralHomeId, emailAddress, status, emailSentAt, notes, createdAt)
              VALUES (?,?,?,?,?,?,?)`,
        args: [reqId, h.id, h.email, "SENT", now, messageId, now],
      });

      sent++;
      console.log(`  ✓ ${h.name.slice(0, 45)} <${h.email}>`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${h.name.slice(0, 45)}: ${err instanceof Error ? err.message : err}`);

      // Record the failed attempt
      await db.execute({
        sql: `INSERT INTO GplRequest (id, funeralHomeId, emailAddress, status, notes, createdAt)
              VALUES (?,?,?,?,?,?)`,
        args: [reqId, h.id, h.email, "FAILED", String(err), now],
      });
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);

  const stats = await db.execute(`
    SELECT status, COUNT(*) as n FROM GplRequest GROUP BY status
  `);
  console.log("\nGplRequest totals:");
  for (const row of stats.rows) {
    console.log(`  ${row.status}: ${row.n}`);
  }
}

main().catch(console.error);
