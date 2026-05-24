CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  persona TEXT NOT NULL DEFAULT 'career_professional',
  tone TEXT NOT NULL DEFAULT 'friend',
  stress_topics TEXT,
  display_name TEXT,
  date_of_birth TEXT,
  email TEXT,
  auth_provider TEXT,
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  bank_connected INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_accounts (
  user_id TEXT PRIMARY KEY,
  persona_key TEXT NOT NULL,
  accounts_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS coach_sessions (
  user_id TEXT PRIMARY KEY,
  backboard_assistant_id TEXT,
  backboard_thread_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
