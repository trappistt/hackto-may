export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  databasePath: process.env.DATABASE_PATH || "./backend/data/app.db",
  corsOrigin: process.env.FRONTEND_ORIGIN?.trim() || "http://localhost:5173",
  backboardApiKey: process.env.BACKBOARD_API_KEY?.trim() || "",
  backboardAssistantId: process.env.BACKBOARD_ASSISTANT_ID?.trim() || "",
  disclaimer:
    "Educational insights only, not personalized financial advice. Consult a licensed professional for your situation."
};
