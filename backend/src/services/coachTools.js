import * as mock from "../adapters/mockClient.js";
import { buildBlackHoleReport } from "./blackHoleEngine.js";
import { buildUtilizationSnapshot } from "./utilization.js";
import * as store from "../db/store.js";
import { config } from "../config.js";

/** OpenAI-style tool definitions for Backboard */
export const COACH_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_unified_profile",
      description:
        "Get the user's unified financial snapshot: accounts, balances, APRs, total debt, utilization.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "scan_interest_black_holes",
      description:
        "Scan liabilities for interest black holes: monthly interest bleed, rankings, flags, and payoff recommendation.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "recommend_payoff_action",
      description:
        "Recommend which account to pay extra toward this month and estimated 90-day interest saved.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  }
];

/**
 * Execute a coach tool locally (same data as REST routes — no LLM math).
 * @param {string} userId
 * @param {string} name
 */
export async function runCoachTool(userId, name) {
  const accounts = await mock.getAccounts(userId);

  switch (name) {
    case "get_unified_profile": {
      const user = store.getUser(userId);
      const persona = await mock.getPersonaMeta(userId);
      const utilization = buildUtilizationSnapshot(accounts);
      const totalDebt = accounts.reduce((s, a) => s + a.balance, 0);

      return {
        user,
        persona,
        accountCount: accounts.length,
        totalDebt: Math.round(totalDebt * 100) / 100,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          balance: a.balance,
          apr: a.apr,
          minPayment: a.minPayment,
          limit: a.limit
        })),
        utilization: utilization.aggregateUtilizationPercent,
        disclaimer: config.disclaimer
      };
    }
    case "scan_interest_black_holes": {
      if (!accounts.length) {
        return {
          error: "No accounts linked",
          hint: "Seed mock accounts before scanning black holes"
        };
      }
      return buildBlackHoleReport(accounts);
    }
    case "recommend_payoff_action": {
      if (!accounts.length) {
        return { error: "No accounts linked" };
      }
      const report = buildBlackHoleReport(accounts);
      return {
        recommendation: report.recommendation,
        topAccount: report.ranked[0] ?? null,
        disclaimer: report.disclaimer
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
