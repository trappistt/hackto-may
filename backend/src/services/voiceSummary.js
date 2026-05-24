const TONE_FRAMING = {
  friend: {
    open: (name) =>
      name
        ? `Hey ${name}! Your interest scan is in — here's the honest picture. `
        : "Hey! Your interest scan is in — here's the honest picture. ",
    close: "You've got this — small moves add up. "
  },
  mom: {
    open: (name) =>
      name
        ? `${name}, I pulled your numbers — listen up, because this matters. `
        : "Okay, I pulled your numbers — listen up, because this matters. ",
    close: "I'm not going to sugarcoat it, but you're not stuck if you follow the plan. "
  },
  dad: {
    open: (name) =>
      name
        ? `${name}, here's where your money stands — facts first. `
        : "Alright, here's where your money stands — facts first. ",
    close: "Stick to the extra payment plan and you'll see the bleed slow down. "
  },
  coach: {
    open: () => "Your interest black hole scan is ready. ",
    close: ""
  },
  companion: {
    open: () => "I've got your scan — let's walk through it together. ",
    close: "We'll figure out the next step from here. "
  },
  chief_of_staff: {
    open: () => "Interest exposure summary. ",
    close: ""
  }
};

/**
 * Plain-text script for voice playback — derived from black-hole report (no LLM).
 * @param {import("./blackHoleEngine.js").ReturnType<typeof import("./blackHoleEngine.js").buildBlackHoleReport>} report
 * @param {{ tone?: string, displayName?: string } | string} [userOrTone]
 */
export function buildBlackHoleVoiceScript(report, userOrTone) {
  const tone =
    typeof userOrTone === "string"
      ? userOrTone
      : userOrTone?.tone && TONE_FRAMING[userOrTone.tone]
        ? userOrTone.tone
        : "friend";
  const firstName =
    typeof userOrTone === "object" && userOrTone?.displayName?.trim()
      ? userOrTone.displayName.trim().split(/\s+/)[0]
      : null;
  const framing = TONE_FRAMING[tone] ?? TONE_FRAMING.friend;

  const top = report.ranked?.[0];
  if (!top) {
    return "No liabilities on file yet. Link accounts to scan for interest black holes.";
  }

  const total = formatCad(report.totalMonthlyInterestBurn);
  const topBleed = formatCad(top.monthlyInterest);
  const apr = (top.apr * 100).toFixed(1);

  let script = framing.open(firstName);
  script += `Across all debts, you're losing about ${total} per month to interest. `;
  script += `The worst bleed is ${top.name}, at roughly ${topBleed} a month, with an APR around ${apr} percent. `;

  const rec = report.recommendation;
  if (rec) {
    const extra = formatCad(rec.extraPayment);
    const saved = formatCad(rec.interestSaved90Days);
    if (tone === "mom") {
      script += `I want you to put ${extra} extra toward ${rec.accountName} this month — that could save about ${saved} in interest over the next ninety days. `;
    } else if (tone === "dad") {
      script += `Action item: ${extra} extra on ${rec.accountName} this month. Projected savings: about ${saved} over ninety days. `;
    } else if (tone === "friend") {
      script += `If you can swing ${extra} extra on ${rec.accountName} this month, you might save around ${saved} in interest over the next ninety days. `;
    } else {
      script += `Recommendation: put ${extra} extra toward ${rec.accountName} this month. That could save about ${saved} in interest over the next ninety days. `;
    }
  }

  if (top.flags?.length) {
    const flagPhrases = top.flags.map(flagToPhrase).filter(Boolean);
    if (flagPhrases.length) {
      const prefix =
        tone === "mom" ? "Watch out — " : tone === "dad" ? "Flag: " : "Heads up: ";
      script += `${prefix}${flagPhrases.join(", ")}. `;
    }
  }

  script += framing.close;
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
