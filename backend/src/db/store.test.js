import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { initDb, closeDb } from "./index.js";
import * as store from "./store.js";
import { seedMockAccounts, getAccounts } from "../adapters/mockClient.js";

test("users and accounts persist across db sessions", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hackto-test-"));
  const dbPath = join(dir, "test.db");

  initDb(dbPath);
  const user = store.createUser({ tone: "coach" });
  await seedMockAccounts(user.id, "alex");
  const bleed1 = (await getAccounts(user.id)).length;
  closeDb();

  initDb(dbPath);
  const reloaded = store.getUser(user.id);
  const accounts = await getAccounts(user.id);
  closeDb();
  rmSync(dir, { recursive: true, force: true });

  assert.ok(reloaded);
  assert.equal(reloaded.tone, "coach");
  assert.equal(bleed1, 3);
  assert.equal(accounts.length, 3);
});

test("goals persist across db sessions", () => {
  const dir = mkdtempSync(join(tmpdir(), "hackto-test-"));
  const dbPath = join(dir, "test.db");

  initDb(dbPath);
  const user = store.createUser({});
  store.createGoal(user.id, "extra_payment", { extraPayment: 75, accountId: "card-rbc-visa" });
  closeDb();

  initDb(dbPath);
  const goals = store.listGoals(user.id);
  closeDb();
  rmSync(dir, { recursive: true, force: true });

  assert.equal(goals.length, 1);
  assert.equal(goals[0].payload.extraPayment, 75);
});

test("coach session thread_id persists", () => {
  const dir = mkdtempSync(join(tmpdir(), "hackto-test-"));
  const dbPath = join(dir, "test.db");

  initDb(dbPath);
  const user = store.createUser({});
  store.saveCoachSession(user.id, "asst-1", "thr-abc");
  closeDb();

  initDb(dbPath);
  const session = store.getCoachSession(user.id);
  closeDb();
  rmSync(dir, { recursive: true, force: true });

  assert.equal(session?.backboardAssistantId, "asst-1");
  assert.equal(session?.backboardThreadId, "thr-abc");
});
