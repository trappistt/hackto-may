import { config, isElevenLabsConfigured } from "../config.js";

export { isElevenLabsConfigured };

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";

/**
 * Convert text to speech via ElevenLabs REST API.
 * @param {string} text
 * @returns {Promise<{ audioBase64: string, contentType: string }>}
 */
export async function synthesizeSpeech(text) {
  if (!isElevenLabsConfigured()) {
    const err = new Error("ElevenLabs not configured");
    err.status = 501;
    throw err;
  }

  const voiceId = config.elevenlabsVoiceId;
  const url = new URL(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`);
  url.searchParams.set("output_format", "mp3_44100_128");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": config.elevenlabsApiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg"
    },
    body: JSON.stringify({
      text,
      model_id: config.elevenlabsModelId
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(
      detail ? `ElevenLabs TTS failed: ${detail.slice(0, 200)}` : `ElevenLabs TTS failed (${res.status})`
    );
    err.status = res.status >= 500 ? 502 : 502;
    throw err;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    audioBase64: buffer.toString("base64"),
    contentType: res.headers.get("content-type") ?? "audio/mpeg"
  };
}
