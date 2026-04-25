/**
 * One-off test: sends a single GPL request email to a specified address.
 * Run: npx tsx --env-file=.env.local scripts/test-email.ts <recipient>
 */

import { createTransport } from "nodemailer";

const TO = process.argv[2] || "aarushprasad@hotmail.com";
const REF_ID = "testref001";

async function main() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("SMTP_USER and SMTP_PASS not set");
    process.exit(1);
  }

  const transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.verify();
  console.log("SMTP connection OK.");

  const info = await transporter.sendMail({
    from: `"Eulogy Pricing Research" <${process.env.SMTP_USER}>`,
    to: TO,
    subject: `GPL Price List Request — Test Funeral Home [Ref:${REF_ID}]`,
    text: `Dear Test Funeral Home Team,

I hope this message finds you well. I am reaching out on behalf of Eulogy, a free service that helps families understand funeral pricing in their area.

Under the FTC Funeral Rule (16 C.F.R. Part 453), funeral homes are required to provide a General Price List (GPL) to anyone who requests one in person. We are respectfully asking if you would be willing to share your current General Price List so we can include your pricing information on our platform, helping families make informed decisions during a difficult time.

You may respond to this email by:
1. Attaching your General Price List (PDF or any format)
2. Pasting your pricing information directly in your reply
3. Providing a link to your online price list

Your pricing information will be displayed on Eulogy (https://eulogy-nu.vercel.app) alongside other funeral homes in your area, with full attribution to your business.

This is completely voluntary — while the FTC Funeral Rule requires in-person disclosure, we appreciate any transparency you choose to share online.

Thank you for your time and for the important service you provide to families in your community.

Warm regards,
Eulogy Pricing Transparency Project
https://eulogy-nu.vercel.app
[Ref:${REF_ID}]`,
    headers: { "X-Eulogy-Request-ID": REF_ID },
  });

  console.log(`Sent! Message-ID: ${info.messageId}`);
  console.log(`To: ${TO}`);
  console.log(`\nWhen you reply (with a PDF or price text), run:`);
  console.log(`  npx tsx --env-file=.env.local scripts/check-replies.ts`);
}

main().catch(console.error);
