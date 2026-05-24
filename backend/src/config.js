export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  databasePath: process.env.DATABASE_PATH || "./backend/data/app.db",
  corsOrigin: process.env.FRONTEND_ORIGIN?.trim() || "http://localhost:5173",
  get backboardApiKey() {
    return process.env.BACKBOARD_API_KEY?.trim() || "";
  },
  get backboardAssistantId() {
    return process.env.BACKBOARD_ASSISTANT_ID?.trim() || "";
  },
  disclaimer:
    "Educational insights only, not personalized financial advice. Consult a licensed professional for your situation."
};

export function isBackboardConfigured() {
  return Boolean(config.backboardApiKey && config.backboardAssistantId);
}
