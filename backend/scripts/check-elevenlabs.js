/**
 * Verify ELEVENLABS_API_KEY from .env
 * Usage: npm run elevenlabs:check
 */
import { config as loadEnv } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = resolve(root, ".env");
loadEnv({ path: envPath, override: true });

const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
const voiceId = process.env.ELEVENLABS_VOICE_ID?.trim() || "EXAVITQu4vr4xnSDxMaL";

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!apiKey) {
  fail(
    `ELEVENLABS_API_KEY is missing or empty (looked in ${envPath}). Save .env and use exact name ELEVENLABS_API_KEY=...`
  );
}

console.log(`Checking ElevenLabs credentials (${envPath})...\n`);

const voicesRes = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: { "xi-api-key": apiKey }
});

if (voicesRes.ok) {
  const voices = await voicesRes.json();
  console.log(`✓ API key valid (${voices.voices?.length ?? 0} voices in account)`);
} else if (voicesRes.status === 401) {
  const body = await voicesRes.text();
  if (body.includes("missing_permissions") || body.includes("voices_read")) {
    console.log("ℹ Skipping voices list (key lacks voices_read — TTS test below is what the app uses)");
  } else {
    console.error("Voices list failed:", voicesRes.status, body.slice(0, 300));
    fail("Invalid ELEVENLABS_API_KEY");
  }
} else {
  const body = await voicesRes.text();
  console.error("Voices list failed:", voicesRes.status, body.slice(0, 300));
  fail("Could not reach ElevenLabs API");
}

const ttsUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`);
ttsUrl.searchParams.set("output_format", "mp3_44100_128");

const ttsRes = await fetch(ttsUrl, {
  method: "POST",
  headers: {
    "xi-api-key": apiKey,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "ElevenLabs connection OK.",
    model_id: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_flash_v2_5"
  })
});

if (!ttsRes.ok) {
  const body = await ttsRes.text();
  console.error("\nTTS test failed:", ttsRes.status, body.slice(0, 300));
  fail(`Could not synthesize with voice ${voiceId}`);
}

const bytes = (await ttsRes.arrayBuffer()).byteLength;
console.log(`✓ TTS test OK (${bytes} bytes mp3, voice ${voiceId})`);
console.log("\nElevenLabs TTS is working.");
console.log("Next: npm run convai:check  (local ConvAI tools)");
console.log("Then: docs/ELEVENLABS_CONVAI.md  (dashboard + ngrok)");
