import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDb, closeDb } from "../db/index.js";
import * as store from "../db/store.js";
import { seedMockAccounts } from "../adapters/mockClient.js";
import { runCoachTool } from "./coachTools.js";

test("coach tools return same numbers as domain engine for alex", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hackto-coach-"));
  const dbPath = join(dir, "test.db");

  initDb(dbPath);
  const user = store.createUser({ tone: "coach" });
  await seedMockAccounts(user.id, "alex");

  const report = await runCoachTool(user.id, "scan_interest_black_holes");
  assert.equal(report.ranked[0].accountId, "card-rbc-visa");
  assert.ok(report.totalMonthlyInterestBurn > 0);

  const rec = await runCoachTool(user.id, "recommend_payoff_action");
  assert.equal(rec.recommendation.accountId, "card-rbc-visa");
  assert.equal(rec.recommendation.extraPayment, 75);

  const profile = await runCoachTool(user.id, "get_unified_profile");
  assert.equal(profile.accountCount, 3);

  closeDb();
  rmSync(dir, { recursive: true, force: true });
});
