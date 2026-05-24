export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  apiBaseUrl: process.env.API_BASE_URL?.trim() || "http://localhost:3001",
  databasePath: process.env.DATABASE_PATH || "./backend/data/app.db",
  corsOrigin: process.env.FRONTEND_ORIGIN?.trim() || "http://localhost:5173",
  get backboardApiKey() {
    return process.env.BACKBOARD_API_KEY?.trim() || "";
  },
  get backboardAssistantId() {
    return process.env.BACKBOARD_ASSISTANT_ID?.trim() || "";
  },
  get elevenlabsApiKey() {
    return process.env.ELEVENLABS_API_KEY?.trim() || "";
  },
  get elevenlabsVoiceId() {
    return process.env.ELEVENLABS_VOICE_ID?.trim() || "EXAVITQu4vr4xnSDxMaL";
  },
  elevenlabsModelId: process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_flash_v2_5",
  get elevenlabsWebhookSecret() {
    return process.env.ELEVENLABS_WEBHOOK_SECRET?.trim() || "";
  },
  disclaimer:
    "Educational insights only, not personalized financial advice. Consult a licensed professional for your situation."
};

export function isBackboardConfigured() {
  return Boolean(config.backboardApiKey && config.backboardAssistantId);
}

export function isElevenLabsConfigured() {
  return Boolean(config.elevenlabsApiKey);
}
