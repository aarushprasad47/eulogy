/**
 * Sends 3 GPL request emails to a test address (simulating real funeral homes).
 * Creates real GplRequest records in the DB so check-replies.ts can match replies.
 * Run: npx tsx --env-file=.env.local scripts/send-test-batch.ts
 */

import { createClient } from "@libsql/client";
import { createTransport } from "nodemailer";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const TEST_EMAIL = "aarushprasad@hotmail.com";

function buildBody(homeName: string, city: string, state: string, reqId: string) {
  return `Dear ${homeName} Team,

I hope this message finds you well. I am reaching out on behalf of Eulogy, a free service that helps families understand funeral pricing in their area.

Under the FTC Funeral Rule (16 C.F.R. Part 453), funeral homes are required to provide a General Price List (GPL) to anyone who requests one in person. We are respectfully asking if you would be willing to share your current General Price List so we can include your pricing information on our platform, helping families in ${city}, ${state} make informed decisions during a difficult time.

You may respond to this email by:
1. Attaching your General Price List (PDF or any format)
2. Pasting your pricing information directly in your reply
3. Providing a link to your online price list

Thank you for your time and for the important service you provide to families in your community.

Warm regards,
Eulogy Pricing Transparency Project
https://eulogy-nu.vercel.app
[Ref:${reqId}]`;
}

async function main() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP_USER and SMTP_PASS must be set");
    process.exit(1);
  }

  // Pick 3 real funeral homes from the DB that have no services yet
  const rows = await db.execute({
    sql: `SELECT f.id, f.name, f.city, f.state
          FROM FuneralHome f
          LEFT JOIN GplRequest g ON g.funeralHomeId = f.id
          WHERE g.id IS NULL
          ORDER BY RANDOM()
          LIMIT 3`,
    args: [],
  });

  const homes = rows.rows as unknown as { id: string; name: string; city: string; state: string }[];
  if (homes.length < 3) { console.error("Not enough homes in DB"); process.exit(1); }

  const transporter = createTransport({
    host: "smtp.gmail.com", port: 465, secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.verify();
  console.log("SMTP OK. Sending 3 test emails to", TEST_EMAIL, "\n");

  const now = new Date().toISOString();
  const sent: { reqId: string; home: string }[] = [];

  for (let i = 0; i < 3; i++) {
    const h = homes[i];
    const reqId = "gpl" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    const subject = `GPL Price List Request — ${h.name} [Ref:${reqId}]`;

    const info = await transporter.sendMail({
      from: `"Eulogy Pricing Research" <${process.env.SMTP_USER}>`,
      to: TEST_EMAIL,
      subject,
      text: buildBody(h.name, h.city, h.state, reqId),
      headers: { "X-Eulogy-Request-ID": reqId },
    });

    // Store GplRequest in DB so the reply checker can match it
    await db.execute({
      sql: `INSERT INTO GplRequest (id, funeralHomeId, emailAddress, status, emailSentAt, notes, createdAt)
            VALUES (?,?,?,?,?,?,?)`,
      args: [reqId, h.id, TEST_EMAIL, "SENT", now, info.messageId || "", now],
    });

    sent.push({ reqId, home: h.name });
    console.log(`[${i + 1}/3] Sent for: ${h.name} (${h.city}, ${h.state})`);
    console.log(`       Ref: ${reqId}`);
    console.log(`       Message-ID: ${info.messageId}\n`);

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log("─".repeat(55));
  console.log("All 3 sent. Check your Hotmail inbox.\n");
  console.log("Reply to each email with a different GPL PDF.");
  console.log("Each reply will be matched by its [Ref:ID] in the subject.\n");
  console.log("When done replying, run:");
  console.log("  npx tsx --env-file=.env.local scripts/check-replies.ts");
}

main().catch(console.error);
