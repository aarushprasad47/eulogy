/**
 * One-time script: creates the ElevenLabs Conversational AI agent for GPL collection calls.
 * Run once, then add the printed AGENT_ID to .env.local and Vercel.
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/create-elevenlabs-agent.ts
 *
 * Requires: ELEVENLABS_API_KEY in .env.local
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY not set in .env.local");
  process.exit(1);
}

const WEBHOOK_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/call/webhook`
    : "https://eulogy.vercel.app/api/call/webhook";

const SYSTEM_PROMPT = `You are a polite and professional representative from Eulogy, a funeral price transparency platform.
Your goal is to collect the General Price List (GPL) from the funeral home you are calling, as required by the FTC Funeral Rule.

Guidelines:
- Be warm, respectful, and understanding — funeral home staff deal with grief daily.
- Start by introducing yourself and explaining you're calling to request their current GPL for price transparency purposes.
- Ask for the prices of the following services one at a time, pausing to let them answer each:
  1. Basic Services of Funeral Director and Staff
  2. Direct Cremation (with and without container)
  3. Immediate Burial
  4. Forwarding Remains to Another Funeral Home
  5. Receiving Remains from Another Funeral Home
  6. Full Funeral Service (graveside or chapel)
  7. Transfer of Remains to Funeral Home
  8. Embalming
  9. Body Preparation (dressing, cosmetizing)
  10. Viewing / Visitation facilities fee
  11. Hearse / transportation
  12. Least expensive casket price
  13. Least expensive outer burial container / vault
  14. Least expensive urn

- If they give a range, note both the low and high price.
- If they say "call for pricing" or refuse, acknowledge politely and move on.
- After all questions, thank them sincerely and mention their prices will be listed on our free public platform at eulogy.vercel.app.
- Keep your responses brief — this is a phone call, not a chat.
- Do not read out a list; ask one question at a time and wait for the answer.`;

async function createAgent() {
  const body = {
    name: "Eulogy GPL Collector",
    conversation_config: {
      agent: {
        prompt: {
          prompt: SYSTEM_PROMPT,
        },
        first_message:
          "Hello! This is the Eulogy platform calling. We're a free funeral price transparency service, and we're reaching out to request your current General Price List as required by the FTC Funeral Rule. Do you have a few minutes to share your current pricing?",
        language: "en",
      },
      tts: {
        voice_id: "EXAVITQu4vr4xnSDxMaL", // Eleven Monolingual v1 - Sarah (professional, warm)
        model_id: "eleven_turbo_v2_5",
        optimize_streaming_latency: 3,
      },
      asr: {
        quality: "high",
        provider: "elevenlabs",
        keywords: [
          "GPL", "General Price List", "direct cremation", "embalming",
          "casket", "urn", "vault", "hearse", "burial",
        ],
      },
      turn: {
        turn_timeout: 10,
        mode: "turn",
      },
    },
    platform_settings: {
      auth: {
        enable_auth: false,
      },
      evaluation: {
        criteria: [],
      },
      webhook: {
        url: WEBHOOK_URL,
      },
    },
  };

  console.log(`Creating ElevenLabs agent with webhook: ${WEBHOOK_URL}`);

  const res = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed to create agent: ${res.status} ${res.statusText}`);
    console.error(err);
    process.exit(1);
  }

  const data = await res.json();
  console.log("\n✅ Agent created successfully!\n");
  console.log(`Agent ID:   ${data.agent_id}`);
  console.log(`Agent Name: ${data.name ?? "Eulogy GPL Collector"}`);
  console.log(`\nAdd this to .env.local and Vercel environment variables:`);
  console.log(`  ELEVENLABS_AGENT_ID=${data.agent_id}`);
  console.log(`  ELEVENLABS_API_KEY=${API_KEY}`);
}

createAgent().catch(console.error);
