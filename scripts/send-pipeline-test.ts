/**
 * End-to-end pipeline test:
 *   1. Upserts "Complete Test Funeral Home - #1" in Chino, CA into MongoDB
 *   2. Creates a GplRequest record
 *   3. Sends the GPL request email to aarushprasad@hotmail.com
 *
 * Run: npx tsx --env-file=.env.local scripts/send-pipeline-test.ts
 */

import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

const TEST_HOME = {
  name: "Complete Test Funeral Home - #1",
  city: "Chino",
  state: "CA",
  zip: "91710",
  email: "aarushprasad@hotmail.com",
  phone: "",
  website: "",
  services: [],
  verified: false,
  dataSource: "MANUAL",
  lat: 34.0122,
  lng: -117.6889,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function mkid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}

async function main() {
  const mongo = new MongoClient(process.env.MONGODB_URI!);
  await mongo.connect();
  const db = mongo.db();

  // 1. Upsert the funeral home
  const existing = await db.collection("FuneralHome").findOne({ name: TEST_HOME.name, city: "Chino" });
  let homeId: string;

  if (existing) {
    homeId = String(existing._id);
    console.log(`✓ Found existing home: ${homeId}`);
  } else {
    homeId = mkid();
    await db.collection("FuneralHome").insertOne({ _id: homeId as any, ...TEST_HOME });
    console.log(`✓ Created home: ${homeId}`);
  }

  // 2. Create GplRequest
  const reqId = mkid();
  await db.collection("GplRequest").insertOne({
    _id: reqId as any,
    funeralHomeId: homeId,
    emailAddress: TEST_HOME.email,
    status: "PENDING",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`✓ Created GplRequest: ${reqId}`);

  // 3. Send the email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const subject = `Request for General Price List — ${TEST_HOME.name}`;
  const html = `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
  <div style="border-bottom: 2px solid #6b7280; padding-bottom: 16px; margin-bottom: 24px;">
    <h2 style="margin: 0; font-size: 20px; font-weight: 600;">Eulogy — Funeral Price Transparency</h2>
  </div>
  <p>Dear ${TEST_HOME.name} Staff,</p>
  <p>I am writing to request your current <strong>General Price List (GPL)</strong> as required under the
  <strong>FTC Funeral Rule</strong> (16 C.F.R. Part 453).</p>
  <p>Please reply to this email with your current GPL in any format (PDF, email, or plain text is fine).</p>
  <p style="background: #f3f4f6; padding: 16px; border-left: 4px solid #6b7280; border-radius: 4px;">
    We are a nonprofit transparency platform (<strong>Eulogy</strong>) that helps grieving families compare
    funeral prices in their area at no cost.
  </p>
  <p>Thank you for your time and cooperation.</p>
  <p>Best regards,<br><strong>The Eulogy Team</strong><br>
  <a href="https://eulogy.vercel.app" style="color: #6b7280;">eulogy.vercel.app</a></p>
</div>`;

  await transporter.sendMail({
    from: `"Eulogy Team" <${process.env.SMTP_USER}>`,
    to: TEST_HOME.email,
    subject,
    html,
  });

  // Mark as SENT
  await db.collection("GplRequest").updateOne(
    { _id: reqId as any },
    { $set: { status: "SENT", emailSentAt: new Date() } }
  );

  console.log(`✓ Email sent to ${TEST_HOME.email}`);
  console.log(`\nHome ID  : ${homeId}`);
  console.log(`Request  : ${reqId}`);
  console.log(`\nNow reply to the email with a GPL PDF, then run:`);
  console.log(`  npx tsx --env-file=.env.local scripts/check-replies.ts --watch`);

  await mongo.close();
}

main().catch(console.error);
