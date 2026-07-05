// Postgres-backed data layer (works with Vercel Postgres, Neon, Supabase, or any
// standard Postgres connection string). This replaces the local SQLite file used
// in the original version, because serverless platforms like Vercel don't have a
// persistent filesystem for a SQLite file to live on.
//
// For local development/testing without a real Postgres server, set USE_PGLITE=1
// to fall back to an embedded, file-free Postgres-compatible engine (PGlite).
// In production (Vercel), set POSTGRES_URL (or DATABASE_URL) instead.

let pool;
let usingPglite = false;

if (process.env.USE_PGLITE) {
  usingPglite = true;
  const { PGlite } = require("@electric-sql/pglite");
  const pglite = new PGlite(process.env.PGLITE_PATH);
  pool = {
    query: (text, params) => pglite.query(text, params),
  };
} else {
  const { Pool } = require("pg");
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Missing POSTGRES_URL or DATABASE_URL environment variable. Set USE_PGLITE=1 for local testing without a real Postgres database."
    );
  }
  pool = new Pool({
    connectionString,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: false },
  });
}

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      monthly_budget NUMERIC(12,2) NOT NULL DEFAULT 0
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      vendor TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);`);
}

module.exports = { query, initSchema, usingPglite };
