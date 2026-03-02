const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// =====================
// GET BANK ACCOUNTS
// =====================
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, bank_name, account_number, account_name, current_balance, branch, created_at 
       FROM bank_accounts 
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      success: true,
      message: 'Bank accounts fetched successfully',
      data: result.rows,
    });
  } catch (error) {
    console.error('[ERROR] Get bank accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bank accounts',
      error: error.message,
    });
  }
});

module.exports = router;
