import twilio from "twilio";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { phone, funeralHomeName, funeralHomeId } = await request.json();

  if (!phone) {
    return Response.json({ error: "No phone number provided" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return Response.json({ error: "Twilio credentials not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eulogy.vercel.app";
  const twimlUrl = `${appUrl}/api/call/twiml?name=${encodeURIComponent(funeralHomeName || "the funeral home")}&id=${funeralHomeId || ""}`;

  const client = twilio(accountSid, authToken);

  const call = await client.calls.create({
    to:  phone,
    from: fromNumber,
    url:  twimlUrl,
  });

  return Response.json({ success: true, callSid: call.sid, status: call.status });
}
