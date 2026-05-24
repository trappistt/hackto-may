/**
 * Plain-text script for voice playback — derived from black-hole report only (no LLM).
 * @param {import("./blackHoleEngine.js").ReturnType<typeof import("./blackHoleEngine.js").buildBlackHoleReport>} report
 */
export function buildBlackHoleVoiceScript(report) {
  const top = report.ranked?.[0];
  if (!top) {
    return "No liabilities on file yet. Link accounts to scan for interest black holes.";
  }

  const total = formatCad(report.totalMonthlyInterestBurn);
  const topBleed = formatCad(top.monthlyInterest);
  const apr = (top.apr * 100).toFixed(1);

  let script = `Your interest black hole scan is ready. Across all debts, you're losing about ${total} per month to interest. `;
  script += `The worst bleed is ${top.name}, at roughly ${topBleed} a month, with an APR around ${apr} percent. `;

  const rec = report.recommendation;
  if (rec) {
    const extra = formatCad(rec.extraPayment);
    const saved = formatCad(rec.interestSaved90Days);
    script += `Recommendation: put ${extra} extra toward ${rec.accountName} this month. That could save about ${saved} in interest over the next ninety days. `;
  }

  if (top.flags?.length) {
    const flagPhrases = top.flags.map(flagToPhrase).filter(Boolean);
    if (flagPhrases.length) {
      script += `Heads up: ${flagPhrases.join(", ")}. `;
    }
  }

  script += report.disclaimer ?? "This is educational insight, not financial advice.";
  return script;
}

function flagToPhrase(flag) {
  const map = {
    high_utilization: "high credit utilization on that account",
    minimum_payment_trap: "minimum payments may not reduce the balance quickly",
    promo_apr_expiring_soon: "a promotional APR may be ending soon"
  };
  return map[flag] ?? null;
}

function formatCad(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
  }).format(amount);
}
