/**
 * Pure interest / black-hole calculations — no I/O.
 */

/** @param {number} balance @param {number} apr decimal */
export function monthlyInterest(balance, apr) {
  return balance * (apr / 12);
}

/** @param {import('../adapters/types.js').Account} account */
export function utilization(account) {
  if (!account.limit || account.limit <= 0) return null;
  return account.balance / account.limit;
}

/**
 * Months to pay off with fixed payment; returns null if payment <= interest only.
 * @param {number} balance
 * @param {number} apr
 * @param {number} payment
 * @param {number} [maxMonths=600]
 */
export function monthsToPayoff(balance, apr, payment, maxMonths = 600) {
  let remaining = balance;
  let months = 0;
  const monthlyRate = apr / 12;

  while (remaining > 0.01 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    if (payment <= interest) return null;
    remaining = remaining + interest - payment;
    months += 1;
  }

  return months >= maxMonths ? null : months;
}

/**
 * Interest paid over `months` with fixed payment (approximate simulation).
 */
export function interestPaidOverMonths(balance, apr, payment, months) {
  let remaining = balance;
  let totalInterest = 0;
  const monthlyRate = apr / 12;

  for (let m = 0; m < months && remaining > 0.01; m++) {
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    const principal = Math.min(remaining, Math.max(0, payment - interest));
    remaining -= principal;
  }

  return totalInterest;
}

/** @param {import('../adapters/types.js').Account} account */
export function flagsForAccount(account, monthsAtMin) {
  const flags = [];
  const util = utilization(account);

  if (util !== null && util >= 0.7) flags.push("high_utilization");
  if (monthsAtMin === null || monthsAtMin > 60) flags.push("minimum_payment_trap");

  if (account.promoAprExpiresAt) {
    const expires = new Date(account.promoAprExpiresAt);
    const daysUntil = (expires - new Date()) / (1000 * 60 * 60 * 24);
    if (daysUntil > 0 && daysUntil <= 120) flags.push("promo_apr_expiring_soon");
  }

  return flags;
}

/**
 * Higher score = worse black hole.
 * @param {import('../adapters/types.js').Account} account
 */
export function blackHoleScore(account, monthsAtMin) {
  const interest = monthlyInterest(account.balance, account.apr);
  const util = utilization(account) ?? 0;
  let score = interest * 10 + util * 50;

  if (monthsAtMin === null) score += 40;
  else if (monthsAtMin > 48) score += 25;

  if (account.promoAprExpiresAt) {
    const expires = new Date(account.promoAprExpiresAt);
    if (expires > new Date()) score += 15;
  }

  return score;
}

/**
 * @param {import('../adapters/types.js').Account[]} accounts
 */
export function buildBlackHoleReport(accounts) {
  const analyzed = accounts.map((account) => {
    const monthly = monthlyInterest(account.balance, account.apr);
    const monthsAtMin = monthsToPayoff(account.balance, account.apr, account.minPayment);
    const util = utilization(account);
    const principalFromMin = Math.max(0, account.minPayment - monthly);

    return {
      accountId: account.id,
      name: account.name,
      type: account.type,
      balance: account.balance,
      apr: account.apr,
      monthlyInterest: round2(monthly),
      utilization: util !== null ? round4(util) : null,
      minPayment: account.minPayment,
      principalFromMin: round2(principalFromMin),
      monthsAtMinimum: monthsAtMin,
      flags: flagsForAccount(account, monthsAtMin),
      blackHoleScore: blackHoleScore(account, monthsAtMin)
    };
  });

  analyzed.sort((a, b) => b.blackHoleScore - a.blackHoleScore);

  const totalMonthlyInterestBurn = round2(
    analyzed.reduce((sum, row) => sum + row.monthlyInterest, 0)
  );

  const top = analyzed[0];
  const extraPayment = 75;
  const recommendation = top
    ? buildRecommendation(accounts.find((a) => a.id === top.accountId), extraPayment)
    : null;

  return {
    totalMonthlyInterestBurn,
    ranked: analyzed,
    recommendation,
    disclaimer: "Educational insights only, not personalized financial advice."
  };
}

/** @param {import('../adapters/types.js').Account | undefined} account */
function buildRecommendation(account, extraPayment) {
  if (!account) return null;

  const payment = account.minPayment + extraPayment;
  const interest90Min = interestPaidOverMonths(
    account.balance,
    account.apr,
    account.minPayment,
    3
  );
  const interest90Extra = interestPaidOverMonths(account.balance, account.apr, payment, 3);

  return {
    accountId: account.id,
    accountName: account.name,
    extraPayment,
    strategy: "avalanche",
    interestSaved90Days: round2(Math.max(0, interest90Min - interest90Extra)),
    rationale: `Highest monthly interest bleed ($${monthlyInterest(account.balance, account.apr).toFixed(2)}/mo). Pay $${extraPayment} above minimum here first.`
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}
