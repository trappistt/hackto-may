import { getDb } from "./index.js";

/**
 * @typedef {Object} UserRow
 * @property {string} id
 * @property {string} persona
 * @property {string} tone
 * @property {string[]} stressTopics
 * @property {string} createdAt
 */

/**
 * @param {{ persona?: string, tone?: string, stressTopics?: string[] }} data
 */
export function createUser(data) {
  const id = crypto.randomUUID();
  const persona = data.persona ?? "career_professional";
  const tone = data.tone ?? "coach";
  const stressTopics = JSON.stringify(data.stressTopics ?? []);

  getDb()
    .prepare(
      `INSERT INTO users (id, persona, tone, stress_topics)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, persona, tone, stressTopics);

  return getUser(id);
}

/** @param {string} id */
export function getUser(id) {
  const row = getDb()
    .prepare(`SELECT id, persona, tone, stress_topics, created_at FROM users WHERE id = ?`)
    .get(id);

  if (!row) return null;

  return {
    id: row.id,
    persona: row.persona,
    tone: row.tone,
    stressTopics: JSON.parse(row.stress_topics || "[]"),
    createdAt: row.created_at
  };
}

/**
 * @param {string} id
 * @param {{ persona?: string, tone?: string, stressTopics?: string[] }} patch
 */
export function updateUser(id, patch) {
  const existing = getUser(id);
  if (!existing) return null;

  const persona = patch.persona ?? existing.persona;
  const tone = patch.tone ?? existing.tone;
  const stressTopics = patch.stressTopics ?? existing.stressTopics;

  getDb()
    .prepare(
      `UPDATE users SET persona = ?, tone = ?, stress_topics = ? WHERE id = ?`
    )
    .run(persona, tone, JSON.stringify(stressTopics), id);

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

/** @param {string} userId */
export function getCoachSession(userId) {
  const row = getDb()
    .prepare(
      `SELECT backboard_assistant_id, backboard_thread_id
       FROM coach_sessions WHERE user_id = ?`
    )
    .get(userId);

  if (!row) return null;

  return {
    backboardAssistantId: row.backboard_assistant_id,
    backboardThreadId: row.backboard_thread_id
  };
}

/**
 * @param {string} userId
 * @param {string} assistantId
 * @param {string} threadId
 */
export function saveCoachSession(userId, assistantId, threadId) {
  getDb()
    .prepare(
      `INSERT INTO coach_sessions (user_id, backboard_assistant_id, backboard_thread_id)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         backboard_assistant_id = excluded.backboard_assistant_id,
         backboard_thread_id = excluded.backboard_thread_id`
    )
    .run(userId, assistantId, threadId);
}
