const { Pool } = require('pg');
require('dotenv').config();

// Debug: Show what env vars are loaded
console.log('[DB INIT] Loaded DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('[DB INIT] Any old DB_NAME?', process.env.DB_NAME || 'none');
console.log('[DB INIT] Current working dir:', process.cwd());

if (!process.env.DATABASE_URL) {
  console.error('[DB FATAL] DATABASE_URL missing - check .env file path or dotenv config');
  process.exit(1);
}

// Allow overriding connection timeout via env, default to 10s
const connectionTimeoutMillis = parseInt(process.env.DB_CONN_TIMEOUT_MS, 10) || 10000;

// Enable SSL for remote hosts (Render, AWS, etc.) unless explicitly disabled
const dbUrl = process.env.DATABASE_URL || '';
const isLocalhost = /localhost|127\.0\.0\.1/.test(dbUrl);
const useSsl = process.env.DB_SSL === 'false' ? false : !isLocalhost;

const poolConfig = {
  connectionString: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_MAX_CLIENTS, 10) || 20,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10) || 30000,
  connectionTimeoutMillis,
};

console.log('[DB INIT] Pool config:', {
  ssl: useSsl,
  max: poolConfig.max,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis,
  connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
});

const pool = new Pool(poolConfig);

// Test connection immediately
(async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database() AS db, version() AS pg_version');
    console.log('[DB SUCCESS] Connected! Database name:', res.rows[0].db);
    console.log('[DB SUCCESS] PostgreSQL version:', res.rows[0].pg_version);
    client.release();
  } catch (err) {
    console.error('[DB TEST FAIL] Connection failed:', err.message);
    // show helpful debug info
    console.error('[DB TEST FAIL] Error name/code:', err.name, err.code || 'no-code');
    console.error('[DB TEST FAIL] Full stack:', err.stack);
    console.error('[DB TEST FAIL] Pool waiting count / total count not exposed here — check network, host/port, and DB credentials.');
  }
})();

pool.on('error', (err) => {
  console.error('[DB ERROR] Idle client error:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
};