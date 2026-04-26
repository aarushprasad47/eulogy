import { NextRequest } from "next/server";

// Twilio fetches this when the call is answered.
// Gets a signed ElevenLabs WebSocket URL and streams audio through it.
async function getSignedUrl(): Promise<string | null> {
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  const apiKey  = process.env.ELEVENLABS_API_KEY;
  if (!agentId || !apiKey) return null;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
    { headers: { "xi-api-key": apiKey } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.signed_url ?? null;
}

async function handler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeName = searchParams.get("name") || "your funeral home";
  const homeId   = searchParams.get("id")   || "";

  const signedUrl = await getSignedUrl();

  // If ElevenLabs is configured, stream through it
  if (signedUrl) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${signedUrl}">
      <Parameter name="funeral_home_name" value="${homeName.replace(/"/g, "&quot;")}" />
      <Parameter name="funeral_home_id"   value="${homeId}" />
    </Stream>
  </Connect>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Fallback: plain TTS if ElevenLabs not configured
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Hello, this is Eulogy calling. We are a funeral price transparency platform
    reaching out to request your current General Price List under the F T C Funeral Rule.
    Please visit eulogy dot vercel dot app to submit your prices, or reply to our email.
    Thank you.
  </Say>
</Response>`;
  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

export const POST = handler;
export const GET  = handler;
