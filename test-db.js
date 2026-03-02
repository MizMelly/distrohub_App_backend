// test-db.js
require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL:', process.env.DATABASE_URL || 'MISSING');
console.log('Current dir:', process.cwd());

if (!process.env.DATABASE_URL) {
  console.error('FATAL: No DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,  // give it 15 seconds
});

(async () => {
  try {
    const client = await pool.connect();
    console.log('[SUCCESS] Connected to DB!');
    const res = await client.query('SELECT current_database() AS db, version() AS version');
    console.log('Database name:', res.rows[0].db);
    console.log('PostgreSQL version:', res.rows[0].version);
    client.release();
  } catch (err) {
    console.error('[FAIL] Connection error:');
    console.error(err.message);
    console.error('Full stack:', err.stack);
  } finally {
    await pool.end();
  }
})();