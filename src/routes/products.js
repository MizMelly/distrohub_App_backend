const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// Helper for debug logs (consistent style)
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} - ${message}`);
  if (data) {
    console.log('[DEBUG] Data:');
    console.log(JSON.stringify(data, null, 2)); // Pretty-print JSON
  }
};

router.get('/', async (req, res) => {
  const startTime = Date.now();

  // 1. Log request details
  debugLog('GET /api/products - Request received', {
    fullUrl: req.originalUrl,
    queryParams: req.query,
    clientIp: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'unknown',
    authHeader: req.headers.authorization ? 'Present' : 'Missing',
  });

  try {
    const sql = 'SELECT * FROM products ORDER BY name ASC';
    debugLog('Preparing to execute SQL query', {
      sql,
      params: [], // no params in this query
    });

    debugLog('Starting database query...');

    const result = await query(sql);

    const durationMs = Date.now() - startTime;

    // 2. Detailed success logging – full result rendering
    debugLog('Query executed successfully – Full result:', {
      durationMs,
      rowCount: result.rowCount,
      rowsReturned: result.rows.length,
      columns: result.fields ? result.fields.map(f => f.name) : [],
      fullRows: result.rows, // ← THIS RENDERS / LOGS THE COMPLETE QUERY RESULT
    });

    // Optional: Short preview if result is large (avoids flooding logs)
    if (result.rows.length > 5) {
      const preview = result.rows.slice(0, 5).map(row => ({
        id: row.id,
        name: row.name,
        price: row.price,
        category: row.category,
        stock: row.stock,
      }));
      debugLog('Preview of first 5 rows (full result logged above)', { preview });
    }

    // Send response to client
    res.json({
      success: true,
      products: result.rows,
      meta: {
        count: result.rows.length,
        queryTimeMs: durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    const durationMs = Date.now() - startTime;

    console.error('[ERROR] Products route failed:', err.stack || err.message);

    // Detailed error debug
    debugLog('Query execution failed – Error details:', {
      durationMs,
      errorMessage: err.message,
      errorCode: err.code,           // e.g. 42P01 = table does not exist
      errorDetail: err.detail,
      errorHint: err.hint,
      errorPosition: err.position,
      errorFile: err.file,
      errorLine: err.line,
      errorRoutine: err.routine,
      sqlState: err.sqlState,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
});

module.exports = router;