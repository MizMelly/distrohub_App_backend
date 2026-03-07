// routes/test-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

module.exports = async function handler(req, res) {
  console.log('[TEST-DB] Request received');
  console.log('[TEST-DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);

  try {
    const client = await pool.connect();
    console.log('[TEST-DB] Connected!');

    const result = await client.query('SELECT NOW() as time, current_database() as db');
    
    res.status(200).json({
      success: true,
      message: 'Connected to Neon Postgres',
      current_time: result.rows[0].time,
      database_name: result.rows[0].db,
      db_url_loaded: !!process.env.DATABASE_URL
    });

    client.release();
  } catch (err) {
    console.error('[TEST-DB] Error:', err.message);

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code || 'unknown'
    });
  }
};