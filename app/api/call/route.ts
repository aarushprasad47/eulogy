import twilio from "twilio";
import { MongoClient } from "mongodb";
import { NextRequest } from "next/server";

const mongo = new MongoClient(process.env.MONGODB_URI!);

function mkid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 11); }

export async function POST(request: NextRequest) {
  const { phone, funeralHomeName, funeralHomeId } = await request.json();

  if (!phone) return Response.json({ error: "No phone number provided" }, { status: 400 });

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber)
    return Response.json({ error: "Twilio credentials not configured" }, { status: 500 });

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || "https://eulogy.vercel.app";
  const twimlUrl  = `${appUrl}/api/call/twiml?name=${encodeURIComponent(funeralHomeName || "")}&id=${funeralHomeId || ""}`;

  const client = twilio(accountSid, authToken);
  const call   = await client.calls.create({ to: phone, from: fromNumber, url: twimlUrl });

  // Store callSid → funeralHomeId so the webhook can look it up
  await mongo.connect();
  await mongo.db().collection("CallRecord").insertOne({
    _id:           mkid() as any,
    callSid:       call.sid,
    funeralHomeId: funeralHomeId || null,
    funeralHomeName: funeralHomeName || null,
    phone,
    status:        "initiated",
    createdAt:     new Date(),
  });

  return Response.json({ success: true, callSid: call.sid, status: call.status });
}
