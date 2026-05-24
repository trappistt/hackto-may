import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTrends, buildMonthLabels } from "./trends.js";

test("buildMonthLabels returns requested count", () => {
  assert.equal(buildMonthLabels(6).length, 6);
});

test("buildTrends optimized interest is <= minimum in future months", () => {
  const accounts = [
    {
      id: "a1",
      name: "Card",
      type: "credit_card",
      balance: 5000,
      apr: 0.22,
      minPayment: 100,
      limit: 6000
    }
  ];
  const recommendation = {
    accountId: "a1",
    accountName: "Card",
    extraPayment: 75,
    strategy: "avalanche"
  };
  const trends = buildTrends(accounts, recommendation);
  assert.equal(trends.interestBurn.length, 12);
  const last = trends.interestBurn.at(-1);
  assert.ok(last.optimized <= last.minimum);
});
