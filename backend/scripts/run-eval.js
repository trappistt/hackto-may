/**
 * Run backend/eval/scenarios.yaml against local domain + API (no Backboard required for most).
 * Usage: npm run eval
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDb, closeDb } from "../src/db/index.js";
import * as store from "../src/db/store.js";
import { seedMockAccounts } from "../src/adapters/mockClient.js";
import { runCoachTool } from "../src/services/coachTools.js";
import { buildUtilizationSnapshot } from "../src/services/utilization.js";
import { sendCoachMessage } from "../src/services/backboard.js";
import { isBackboardConfigured } from "../src/config.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const scenariosPath = resolve(root, "backend/eval/scenarios.yaml");
const skipCoach = process.argv.includes("--skip-coach");

const doc = parse(readFileSync(scenariosPath, "utf8"));
const scenarios = doc.scenarios ?? [];

const dir = mkdtempSync(join(tmpdir(), "hackto-eval-"));
initDb(join(dir, "eval.db"));

let passed = 0;
let failed = 0;
let skipped = 0;

for (const scenario of scenarios) {
  const label = scenario.id ?? "unnamed";
  process.stdout.write(`• ${label} … `);

  try {
    const user = store.createUser({
      tone: scenario.setup?.tone ?? "coach"
    });
    await seedMockAccounts(user.id, scenario.persona ?? "alex");

    if (scenario.expect_tool) {
      const out = await runCoachTool(user.id, scenario.expect_tool);
      runAssertions(scenario.assert ?? [], JSON.stringify(out), out);
    } else if (scenario.expect_api === "GET /users/:id/utilization") {
      const accounts = await (await import("../src/adapters/mockClient.js")).getAccounts(user.id);
      const out = buildUtilizationSnapshot(accounts);
      runAssertions(scenario.assert ?? [], JSON.stringify(out), out);
    } else if (scenario.user_message) {
      if (!isBackboardConfigured() || skipCoach) {
        skipped += 1;
        console.log("SKIP (Backboard not configured)");
        continue;
      }
      const { reply } = await sendCoachMessage(user.id, scenario.user_message);
      runAssertions(scenario.assert ?? [], reply, { reply });
    } else {
      throw new Error("Scenario has no expect_tool, expect_api, or user_message");
    }

    passed += 1;
    console.log("OK");
  } catch (err) {
    failed += 1;
    console.log("FAIL");
    console.error(`  ${err.message}`);
  }
}

closeDb();
rmSync(dir, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed, ${skipped} skipped`);
process.exit(failed > 0 ? 1 : 0);

function runAssertions(assertions, text, data) {
  const lower = text.toLowerCase();

  for (const rule of assertions) {
    if (rule.includes("top ranked account is")) {
      const id = rule.split("is ").pop().trim();
      const topId = data.ranked?.[0]?.accountId ?? data.topAccount?.accountId;
      if (topId !== id) throw new Error(`Expected top account ${id}, got ${topId}`);
      continue;
    }

    if (rule.includes("mentions monthly interest") || rule.includes('"bleed"')) {
      if (!/interest|bleed|month/i.test(text)) {
        throw new Error(`Expected interest/bleed mention in: ${text.slice(0, 120)}`);
      }
      continue;
    }

    if (rule.includes("three credit cards") || rule.includes("total debt")) {
      if (!/account|debt|card/i.test(text)) throw new Error("Expected profile debt/card mention");
      continue;
    }

    if (rule.includes("concrete dollar amount")) {
      if (!/\$|cad|\d+\.\d{2}/i.test(text)) throw new Error("Expected dollar amount in response");
      continue;
    }

    if (rule.includes("high utilization")) {
      const highList = data.highUtilization ?? [];
      const cards = data.perCard ?? data.cards ?? [];
      const high =
        highList.length > 0 || cards.some((c) => (c.utilization ?? 0) >= 0.7);
      if (!high && !/high utilization|70%|80%|90%/i.test(text)) {
        throw new Error("Expected high utilization flag");
      }
      continue;
    }

    if (rule.includes("non-judgmental") || rule.includes("no shame")) {
      if (/shame|embarrass|irresponsible|stupid|failure/i.test(lower)) {
        throw new Error("Response contains shame language");
      }
      continue;
    }

    if (rule.includes("promo APR") || rule.includes("CIBC")) {
      if (!/promo|cibc|expir/i.test(text)) {
        throw new Error("Expected promo/expiry mention");
      }
      continue;
    }

    console.warn(`  (unknown assert rule, skipped: ${rule})`);
  }
}
