/**
 * @param {import('../adapters/types.js').Account[]} accounts
 */
export function buildUtilizationSnapshot(accounts) {
  const cards = accounts.filter((a) => a.type === "credit_card" && a.limit);

  const perCard = cards.map((a) => ({
    accountId: a.id,
    name: a.name,
    balance: a.balance,
    limit: a.limit,
    utilization: Math.round((a.balance / a.limit) * 10000) / 10000,
    utilizationPercent: Math.round((a.balance / a.limit) * 1000) / 10
  }));

  const totalBalance = cards.reduce((s, a) => s + a.balance, 0);
  const totalLimit = cards.reduce((s, a) => s + (a.limit ?? 0), 0);
  const aggregate =
    totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 10000) / 10000 : null;

  return {
    perCard,
    aggregateUtilization: aggregate,
    aggregateUtilizationPercent:
      aggregate !== null ? Math.round(aggregate * 1000) / 10 : null,
    highUtilization: perCard.filter((c) => c.utilization >= 0.7)
  };
}
