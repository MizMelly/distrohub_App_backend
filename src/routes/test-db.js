

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

module.exports = async function handler(req, res) {
  console.log('[API TEST-DB] Request received');
  console.log('[API TEST-DB] DATABASE_URL exists:', !!process.env.DATABASE_URL);

  try {
    const client = await pool.connect();
    console.log('[API TEST-DB] Connected!');

    const result = await client.query('SELECT current_database() AS db, version() AS version, NOW() AS now');
    
    res.status(200).json({
      success: true,
      message: 'Connected to Neon Postgres via Vercel',
      database_name: result.rows[0].db,
      postgres_version: result.rows[0].version,
      current_time: result.rows[0].now,
      db_url_loaded: !!process.env.DATABASE_URL,
    });

    client.release();
  } catch (err) {
    console.error('[API TEST-DB] Connection failed:', err.message);
    console.error('[API TEST-DB] Error code:', err.code);
    console.error('[API TEST-DB] Stack:', err.stack);

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code || 'unknown',
      db_url_loaded: !!process.env.DATABASE_URL
    });
  }
};