import assert from "node:assert/strict";
import test from "node:test";
import { monthlyInterest, buildBlackHoleReport } from "./blackHoleEngine.js";

test("monthlyInterest for 5200 at 21.99%", () => {
  const interest = monthlyInterest(5200, 0.2199);
  assert.ok(interest > 90 && interest < 100);
});

test("buildBlackHoleReport ranks highest bleed first", () => {
  const report = buildBlackHoleReport([
    {
      id: "low",
      name: "Low",
      type: "credit_card",
      balance: 500,
      apr: 0.15,
      minPayment: 25,
      limit: 2000
    },
    {
      id: "high",
      name: "High",
      type: "credit_card",
      balance: 8000,
      apr: 0.22,
      minPayment: 160,
      limit: 10000
    }
  ]);
  assert.equal(report.ranked[0].accountId, "high");
  assert.ok(report.totalMonthlyInterestBurn > 0);
  assert.ok(report.recommendation?.accountId === "high");
});
