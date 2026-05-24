/**
 * Future: swap mockClient for real bank / aggregator APIs (Flinks, Plaid, etc.)
 * @type {import('./types.js').FinancialAdapter}
 */
export const apiClient = {
  async getAccounts() {
    throw new Error(
      "apiClient not implemented — use POST /users/:id/accounts/mock for hackathon demo"
    );
  }
};
