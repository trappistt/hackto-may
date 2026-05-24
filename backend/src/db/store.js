import { getDb } from "./index.js";

const VALID_TONES = new Set(["friend", "mom", "dad", "coach", "companion", "chief_of_staff"]);

/**
 * @typedef {Object} UserRow
 * @property {string} id
 * @property {string} persona
 * @property {string} tone
 * @property {string[]} stressTopics
 * @property {string|null} displayName
 * @property {string|null} dateOfBirth
 * @property {string|null} email
 * @property {string|null} authProvider
 * @property {boolean} onboardingComplete
 * @property {boolean} bankConnected
 * @property {string} createdAt
 */

/** @param {import('better-sqlite3').Statement} row */
function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    persona: row.persona,
    tone: row.tone,
    stressTopics: JSON.parse(row.stress_topics || "[]"),
    displayName: row.display_name ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    email: row.email ?? null,
    authProvider: row.auth_provider ?? null,
    onboardingComplete: Boolean(row.onboarding_complete),
    bankConnected: Boolean(row.bank_connected),
    createdAt: row.created_at
  };
}

const USER_SELECT = `SELECT id, persona, tone, stress_topics, display_name, date_of_birth,
  email, auth_provider, onboarding_complete, bank_connected, created_at FROM users`;

/**
 * @param {{
 *   persona?: string,
 *   tone?: string,
 *   stressTopics?: string[],
 *   displayName?: string,
 *   dateOfBirth?: string,
 *   email?: string,
 *   authProvider?: string,
 *   onboardingComplete?: boolean,
 *   bankConnected?: boolean
 * }} data
 */
export function createUser(data) {
  const id = crypto.randomUUID();
  const persona = data.persona ?? "career_professional";
  const tone = VALID_TONES.has(data.tone) ? data.tone : "friend";
  const stressTopics = JSON.stringify(data.stressTopics ?? []);

  getDb()
    .prepare(
      `INSERT INTO users (
        id, persona, tone, stress_topics, display_name, date_of_birth,
        email, auth_provider, onboarding_complete, bank_connected
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      persona,
      tone,
      stressTopics,
      data.displayName ?? null,
      data.dateOfBirth ?? null,
      data.email ?? null,
      data.authProvider ?? null,
      data.onboardingComplete ? 1 : 0,
      data.bankConnected ? 1 : 0
    );

  return getUser(id);
}

/** @param {string} email */
export function getUserByEmail(email) {
  const row = getDb()
    .prepare(`${USER_SELECT} WHERE email = ? COLLATE NOCASE`)
    .get(email.trim().toLowerCase());
  return mapUserRow(row);
}

/** @param {string} id */
export function getUser(id) {
  const row = getDb().prepare(`${USER_SELECT} WHERE id = ?`).get(id);
  return mapUserRow(row);
}

/**
 * @param {string} id
 * @param {{
 *   persona?: string,
 *   tone?: string,
 *   stressTopics?: string[],
 *   displayName?: string,
 *   dateOfBirth?: string,
 *   email?: string,
 *   authProvider?: string,
 *   onboardingComplete?: boolean,
 *   bankConnected?: boolean
 * }} patch
 */
export function updateUser(id, patch) {
  const existing = getUser(id);
  if (!existing) return null;

  const persona = patch.persona ?? existing.persona;
  const tone =
    patch.tone && VALID_TONES.has(patch.tone) ? patch.tone : existing.tone;
  const stressTopics = patch.stressTopics ?? existing.stressTopics;
  const displayName =
    patch.displayName !== undefined ? patch.displayName : existing.displayName;
  const dateOfBirth =
    patch.dateOfBirth !== undefined ? patch.dateOfBirth : existing.dateOfBirth;
  const email =
    patch.email !== undefined
      ? patch.email
        ? patch.email.trim().toLowerCase()
        : null
      : existing.email;
  const authProvider =
    patch.authProvider !== undefined ? patch.authProvider : existing.authProvider;
  const onboardingComplete =
    patch.onboardingComplete !== undefined
      ? patch.onboardingComplete
      : existing.onboardingComplete;
  const bankConnected =
    patch.bankConnected !== undefined ? patch.bankConnected : existing.bankConnected;

  getDb()
    .prepare(
      `UPDATE users SET
        persona = ?, tone = ?, stress_topics = ?,
        display_name = ?, date_of_birth = ?, email = ?, auth_provider = ?,
        onboarding_complete = ?, bank_connected = ?
      WHERE id = ?`
    )
    .run(
      persona,
      tone,
      JSON.stringify(stressTopics),
      displayName,
      dateOfBirth,
      email?.trim().toLowerCase() ?? email,
      authProvider,
      onboardingComplete ? 1 : 0,
      bankConnected ? 1 : 0,
      id
    );

  return getUser(id);
}

/**
 * @param {string} userId
 * @param {string} personaKey
 * @param {import('../adapters/types.js').Account[]} accounts
 */
export function saveUserAccounts(userId, personaKey, accounts) {
  getDb()
    .prepare(
      `INSERT INTO user_accounts (user_id, persona_key, accounts_json, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         persona_key = excluded.persona_key,
         accounts_json = excluded.accounts_json,
         updated_at = datetime('now')`
    )
    .run(userId, personaKey, JSON.stringify(accounts));
}

/** @param {string} userId */
export function getUserAccounts(userId) {
  const row = getDb()
    .prepare(`SELECT persona_key, accounts_json FROM user_accounts WHERE user_id = ?`)
    .get(userId);

  if (!row) return { personaKey: null, accounts: [] };

  return {
    personaKey: row.persona_key,
    accounts: JSON.parse(row.accounts_json)
  };
}

/**
 * @param {string} userId
 * @param {string} type
 * @param {object} payload
 */
export function createGoal(userId, type, payload) {
  const id = crypto.randomUUID();
  getDb()
    .prepare(`INSERT INTO goals (id, user_id, type, payload) VALUES (?, ?, ?, ?)`)
    .run(id, userId, type, JSON.stringify(payload));

  return { id, type, payload, userId };
}

/** @param {string} userId */
export function listGoals(userId) {
  const rows = getDb()
    .prepare(
      `SELECT id, type, payload, created_at FROM goals WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(userId);

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    payload: JSON.parse(row.payload),
    createdAt: row.created_at
  }));
}

/**
 * @param {string} userId
 * @param {string} assistantId
 * @param {string} [threadId]
 */
export function saveCoachSession(userId, assistantId, threadId) {
  getDb()
    .prepare(
      `INSERT INTO coach_sessions (user_id, backboard_assistant_id, backboard_thread_id)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         backboard_assistant_id = excluded.backboard_assistant_id,
         backboard_thread_id = COALESCE(excluded.backboard_thread_id, coach_sessions.backboard_thread_id)`
    )
    .run(userId, assistantId, threadId ?? null);
}

/** @param {string} userId */
export function getCoachSession(userId) {
  const row = getDb()
    .prepare(
      `SELECT backboard_assistant_id, backboard_thread_id FROM coach_sessions WHERE user_id = ?`
    )
    .get(userId);

  if (!row) return null;
  return {
    backboardAssistantId: row.backboard_assistant_id,
    backboardThreadId: row.backboard_thread_id
  };
}
