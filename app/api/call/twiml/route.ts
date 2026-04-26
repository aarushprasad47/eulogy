import { NextRequest } from "next/server";

// Twilio fetches this URL when the call is answered.
// For now it reads a script via <Say>. Later: swap <Say> for an ElevenLabs
// <Connect><Stream> block to hand off to an AI voice agent.
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeName = searchParams.get("name") || "your funeral home";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Hello, this is Eulogy calling. Eulogy is a funeral price transparency platform
    that helps families compare funeral home costs in their area.
    We are reaching out to request your current General Price List,
    as required under the F T C Funeral Rule.
    Please visit eulogy dot vercel dot app to submit your prices directly,
    or reply to our email request.
    Thank you, and have a good day.
  </Say>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
