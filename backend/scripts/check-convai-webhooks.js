/**
 * Verify ConvAI server tools work locally (no ElevenLabs dashboard required).
 * Usage: npm run convai:check
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { initDb, closeDb } from "../src/db/index.js";
import * as store from "../src/db/store.js";
import { seedMockAccounts } from "../src/adapters/mockClient.js";
import { buildBlackHoleReport } from "../src/services/blackHoleEngine.js";
import { buildBlackHoleVoiceScript } from "../src/services/voiceSummary.js";
import {
  ELEVENLABS_TOOL_NAMES,
  executeElevenLabsTool,
  resolveUserIdFromWebhook
} from "../src/handlers/elevenlabsWebhook.js";
import { config } from "../src/config.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
loadEnv({ path: resolve(root, ".env"), override: true });

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "hackto-convai-"));
initDb(join(dir, "convai.db"));

try {
  const user = store.createUser({ tone: "coach" });
  await seedMockAccounts(user.id, "alex");

  if (!resolveUserIdFromWebhook({ parameters: { user_id: user.id } })) {
    fail("resolveUserIdFromWebhook could not read user_id");
  }

  console.log("Checking ConvAI server tools (local domain layer)…\n");

  for (const name of ELEVENLABS_TOOL_NAMES) {
    const out = await executeElevenLabsTool(name, user.id);
    if (out?.error) fail(`${name} returned error: ${out.error}`);
    console.log(`✓ ${name}`);
  }

  const accounts = await (await import("../src/adapters/mockClient.js")).getAccounts(user.id);
  const report = buildBlackHoleReport(accounts);
  const script = buildBlackHoleVoiceScript(report);
  if (!script.includes("black hole") && !script.includes("interest")) {
    fail("voice script missing expected content");
  }
  console.log("✓ voice summary script");

  const base = config.apiBaseUrl.replace(/\/$/, "");
  console.log("\nTool catalog (configure in ElevenLabs agent):");
  console.log(`  GET ${base}/api/webhooks/elevenlabs/tools`);
  for (const name of ELEVENLABS_TOOL_NAMES) {
    console.log(`  POST ${base}/api/webhooks/elevenlabs/tools/${name}`);
  }
  console.log(`\nDemo user_id for dynamic variable: ${user.id}`);
  console.log("\nConvAI webhooks are ready. See docs/ELEVENLABS_CONVAI.md for dashboard + ngrok setup.");
} catch (err) {
  fail(err.message);
} finally {
  closeDb();
  rmSync(dir, { recursive: true, force: true });
}
