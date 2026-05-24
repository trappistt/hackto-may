/**
 * @typedef {'credit_card' | 'line_of_credit' | 'installment' | 'student_loan'} AccountType
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} name
 * @property {AccountType} type
 * @property {number} balance
 * @property {number} apr - Annual rate as decimal (0.2199 = 21.99%)
 * @property {number} minPayment
 * @property {number} [limit]
 * @property {number} [dueDay]
 * @property {string} [promoAprExpiresAt] - ISO date
 * @property {number} [aprAfterPromo]
 */

/**
 * @typedef {Object} FinancialAdapter
 * @property {(userId: string) => Promise<Account[]>} getAccounts
 */

export const DISCLAIMER =
  "Educational insights only, not personalized financial advice. Consult a licensed professional for your situation.";
