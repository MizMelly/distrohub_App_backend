// routes/bank-accounts.js – FULL ESM (no require, no module.exports)

import express from 'express';
const router = express.Router();

import { query } from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';

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


export default router;