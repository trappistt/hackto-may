export const config = {
  port: Number(process.env.API_PORT || process.env.PORT || 3001),
  databasePath: process.env.DATABASE_PATH || "./backend/data/app.db",
  backboardApiKey: process.env.BACKBOARD_API_KEY || "",
  backboardAssistantId: process.env.BACKBOARD_ASSISTANT_ID || "",
  disclaimer:
    "Educational insights only, not personalized financial advice. Consult a licensed professional for your situation."
};
