// Example in api/test-db.js or routes/test-db.js
export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as db_name');
    res.status(200).json({
      success: true,
      message: 'Connected to Neon Postgres!',
      current_time: result.rows[0].time,
      db_name: result.rows[0].db_name,
      db_url_loaded: !!process.env.DATABASE_URL
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}