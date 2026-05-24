/**
 * Verify BACKBOARD_API_KEY and BACKBOARD_ASSISTANT_ID from .env
 * Usage: npm run backboard:check
 */
import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: resolve(root, ".env"), override: true });

const apiKey = process.env.BACKBOARD_API_KEY?.trim();
const assistantId = process.env.BACKBOARD_ASSISTANT_ID?.trim();
const base = "https://app.backboard.io/api";

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!apiKey) fail("BACKBOARD_API_KEY is missing in .env");
if (!assistantId) fail("BACKBOARD_ASSISTANT_ID is missing in .env");
if (apiKey.length < 10) fail("BACKBOARD_API_KEY looks too short — paste the full key from the dashboard");

const headers = {
  "X-API-Key": apiKey,
  "Content-Type": "application/json"
};

console.log("Checking Backboard credentials...\n");

// 1) Fetch assistant
const assistantRes = await fetch(`${base}/assistants/${assistantId}`, { headers });
const assistantBody = await assistantRes.json();

if (!assistantRes.ok) {
  console.error("Assistant check failed:", assistantRes.status, assistantBody);
  fail("Could not load assistant — verify BACKBOARD_ASSISTANT_ID");
}

console.log(`✓ API key valid`);
console.log(`✓ Assistant: ${assistantBody.name ?? "(unnamed)"}`);
console.log(`  id: ${assistantBody.assistant_id ?? assistantId}`);

// 2) Send test message
const messageRes = await fetch(`${base}/threads/messages`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    content: "Reply with exactly: Backboard connection OK",
    assistant_id: assistantId,
    stream: false,
    memory: "off"
  })
});
const messageBody = await messageRes.json();

if (!messageRes.ok) {
  console.error("\nMessage test failed:", messageRes.status, messageBody);
  fail("Could not send test message");
}

const preview = (messageBody.content ?? "").slice(0, 200);
console.log(`\n✓ Test message sent`);
console.log(`  thread_id: ${messageBody.thread_id}`);
console.log(`  reply: ${preview}${preview.length >= 200 ? "…" : ""}`);
console.log("\nBackboard is working. Add these to .env if not already set, then we can wire Phase 1b coach.");
