/**
 * Projected trend series for charts — derived from current balances (domain math only).
 */

import { monthlyInterest } from "./blackHoleEngine.js";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** @param {number} count @param {Date} [anchor] */
export function buildMonthLabels(count, anchor = new Date()) {
  const labels = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    labels.push(MONTH_SHORT[d.getMonth()]);
  }
  return labels;
}

/** @param {number} balance @param {number} apr @param {number} payment @param {number} monthsBack */
function balanceMonthsAgo(balance, apr, payment, monthsBack) {
  let b = balance;
  const r = apr / 12;
  for (let i = 0; i < monthsBack; i++) {
    b = (b + payment) / (1 + r);
  }
  return b;
}

/**
 * @param {import('../adapters/types.js').Account[]} accounts
 * @param {number} monthOffset negative = past, 0 = now, positive = future
 * @param {number} extraOnTopAccount
 * @param {string | null} topAccountId
 */
function balancesAtMonthOffset(accounts, monthOffset, extraOnTopAccount, topAccountId) {
  if (monthOffset === 0) {
    return Object.fromEntries(accounts.map((a) => [a.id, a.balance]));
  }

  if (monthOffset < 0) {
    const monthsBack = -monthOffset;
    return Object.fromEntries(
      accounts.map((a) => [
        a.id,
        balanceMonthsAgo(a.balance, a.apr, a.minPayment, monthsBack)
      ])
    );
  }

  const balances = Object.fromEntries(accounts.map((a) => [a.id, a.balance]));
  for (let m = 0; m < monthOffset; m++) {
    for (const a of accounts) {
      const payment =
        a.minPayment + (a.id === topAccountId ? extraOnTopAccount : 0);
      const r = a.apr / 12;
      const bal = balances[a.id];
      const interest = bal * r;
      balances[a.id] = Math.max(0, bal - Math.max(0, payment - interest));
    }
  }
  return balances;
}

/** @param {import('../adapters/types.js').Account[]} accounts @param {Record<string, number>} balances */
function totalMonthlyInterest(accounts, balances) {
  return accounts.reduce(
    (sum, a) => sum + monthlyInterest(balances[a.id] ?? a.balance, a.apr),
    0
  );
}

/** @param {Record<string, number>} balances */
function sumBalances(balances) {
  return Object.values(balances).reduce((s, b) => s + b, 0);
}

/**
 * @param {import('../adapters/types.js').Account[]} accounts
 * @param {import('./blackHoleEngine.js').ReturnType<typeof import('./blackHoleEngine.js').buildBlackHoleReport>['recommendation']} recommendation
 */
export function buildTrends(accounts, recommendation) {
  const pastMonths = 5;
  const futureMonths = 6;
  const pointCount = pastMonths + futureMonths + 1;
  const labels = buildMonthLabels(pointCount);

  const topAccountId = recommendation?.accountId ?? null;
  const extra = recommendation?.extraPayment ?? 0;

  const interestBurn = [];
  const totalBalance = [];

  for (let offset = -pastMonths; offset <= futureMonths; offset++) {
    const balancesMin = balancesAtMonthOffset(accounts, offset, 0, topAccountId);
    const extraForward = offset > 0 ? extra : 0;
    const balancesOpt = balancesAtMonthOffset(
      accounts,
      offset,
      extraForward,
      topAccountId
    );

    const idx = offset + pastMonths;
    interestBurn.push({
      month: labels[idx],
      minimum: round2(totalMonthlyInterest(accounts, balancesMin)),
      optimized: round2(totalMonthlyInterest(accounts, balancesOpt))
    });
    totalBalance.push({
      month: labels[idx],
      minimum: round2(sumBalances(balancesMin)),
      optimized: round2(sumBalances(balancesOpt))
    });
  }

  return {
    months: labels,
    interestBurn,
    totalBalance,
    meta: {
      pastMonths,
      futureMonths,
      extraPayment: extra,
      topAccountName: recommendation?.accountName ?? null
    },
    disclaimer:
      "Projected trends from current balances; past months are estimated. Educational only, not advice."
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
