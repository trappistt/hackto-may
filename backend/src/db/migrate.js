/**
 * Lightweight migrations for existing SQLite DBs.
 * @param {import('better-sqlite3').Database} database
 */
export function migrate(database) {
  const columns = database.prepare("PRAGMA table_info(users)").all();
  const names = new Set(columns.map((c) => c.name));

  const additions = [
    ["display_name", "TEXT"],
    ["date_of_birth", "TEXT"],
    ["email", "TEXT"],
    ["auth_provider", "TEXT"],
    ["onboarding_complete", "INTEGER NOT NULL DEFAULT 0"],
    ["bank_connected", "INTEGER NOT NULL DEFAULT 0"],
    ["age", "TEXT"],
    ["who_uses_tool", "TEXT"],
    ["lifestyle_brief", "TEXT"],
    ["life_context", "TEXT"]
  ];

  for (const [name, type] of additions) {
    if (!names.has(name)) {
      database.exec(`ALTER TABLE users ADD COLUMN ${name} ${type}`);
    }
  }

  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)
    WHERE email IS NOT NULL AND email != '';
  `);
}
