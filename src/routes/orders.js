const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Helper for debug logs
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} - ${message}`);
  if (data) console.log('[DEBUG] Data:', JSON.stringify(data, null, 2));
};

// Generate order number
const generateOrderNo = (customerId) => {
  const timestamp = Date.now();
  return `ORD-${timestamp}-${customerId}`;
};

// =====================
// CREATE ORDER
// =====================
router.post('/', verifyToken, async (req, res) => {
  debugLog('Create order request received', { email: req.user.email });

  const { payment_method, items, total_amount, reference_no, bank_name, bank_account_id, payment_proof, notes } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Order items are required',
    });
  }

  if (!payment_method) {
    return res.status(400).json({
      success: false,
      message: 'Payment method is required',
    });
  }

  if (!total_amount || total_amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total amount is required and must be greater than 0',
    });
  }

  // Validate transfer payment details if payment method is transfer
  if (payment_method === 'transfer') {
    if (!reference_no || !bank_name || !bank_account_id || !payment_proof) {
      return res.status(400).json({
        success: false,
        message: 'Transfer payment requires reference number, your bank name, selected recipient bank account, and payment proof',
      });
    }
  }

  const dbClient = await getClient();

  try {
    await dbClient.query('BEGIN');

    // Get customer_id from email
    debugLog('Fetching customer by email', { email: req.user.email });
    const userResult = await dbClient.query(
      'SELECT sno FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      await dbClient.query('ROLLBACK');
      dbClient.release();
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const customerId = userResult.rows[0].sno;
    
    // Fetch bank account details if transfer payment
    let recipientBankName = null;
    let recipientAccountNumber = null;
    let recipientAccountName = null;

    if (payment_method === 'transfer') {
      debugLog('Fetching bank account', { bankAccountId: bank_account_id });
      const bankAccountResult = await dbClient.query(
        'SELECT id, bank_name, account_number, account_name FROM bank_accounts WHERE id = $1',
        [bank_account_id]
      );

      if (bankAccountResult.rows.length === 0) {
        await dbClient.query('ROLLBACK');
        dbClient.release();
        return res.status(404).json({
          success: false,
          message: 'Selected bank account not found',
        });
      }

      const bankAccount = bankAccountResult.rows[0];
      recipientBankName = bankAccount.bank_name;
      recipientAccountNumber = bankAccount.account_number;
      recipientAccountName = bankAccount.account_name;
      debugLog('Bank account found', { bankName: recipientBankName, accountNumber: recipientAccountNumber });
    }

    const orderNo = generateOrderNo(customerId);
    const now = new Date().toISOString();

    debugLog('Creating order', { customerId, orderNo, paymentMethod: payment_method });

    // 1. Insert into customer_payment
    // payment_method: 'cash' for cash on delivery, 'transfer' for card/transfer
    const paymentMethodForPayment = payment_method === 'cash' ? 'cash' : 'transfer';
    
    // Convert payment_proof to JSON array if it exists
    const paymentProofArray = (payment_method === 'transfer' && payment_proof) 
      ? JSON.stringify([payment_proof])
      : null;
    
    const paymentResult = await dbClient.query(
      `INSERT INTO customer_payments (
        customer_id, 
        payment_date, 
        amount, 
        payment_method, 
        status, 
        updated_at, 
        order_no,
        reference_no,
        bank_name,
        recipient_bank_name,
        recipient_account_number,
        recipient_account_name,
        payment_proof,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)`,
      [
        customerId,
        now,
        total_amount,
        paymentMethodForPayment,
        'pending',
        now,
        orderNo,
        payment_method === 'transfer' ? reference_no : null,
        payment_method === 'transfer' ? bank_name : null,
        recipientBankName,
        recipientAccountNumber,
        recipientAccountName,
        paymentProofArray,
        payment_method === 'transfer' ? (notes || null) : null,
      ]
    );

    debugLog('Payment record created successfully', { customerId, orderNo });

    // 2. Insert into customer_orders
    // Determine payment_type: 'Dcash' for cash on delivery, 'online' for card/transfer
    const paymentType = payment_method === 'cash' ? 'Dcash' : 'online';
    const balanceDue = payment_method === 'cash' ? total_amount : 0;
    const amountPaid = payment_method === 'cash' ? 0 : total_amount;

    const orderResult = await dbClient.query(
      `INSERT INTO customer_orders (
        order_no, 
        customer_id, 
        order_date, 
        status, 
        total_amount, 
        amount_paid,
        balance_due,
        created_by, 
        notes, 
        total_empties_issued, 
        total_empties_returned, 
        payment_type,
        payment_otp_verified,
        net_empties_owed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING order_no`,
      [
        orderNo,
        customerId,
        now,
        'pending',
        total_amount,
        amountPaid,
        balanceDue,
        null,
        'Order placed from mobile app',
        0,
        0,
        paymentType,
        false,
        0,
      ]
    );

    const createdOrderNo = orderResult.rows[0].order_no;
    debugLog('Order record created', { orderNo: createdOrderNo });

    // 3. Insert order items
    for (const item of items) {
      const { product_id, quantity, unit_price } = item;
      const totalPrice = quantity * unit_price;

      await dbClient.query(
        `INSERT INTO order_items (
          order_id, 
          product_id, 
          quantity, 
          unit_price, 
          empties_issued, 
          empties_returned, 
          total_price,
          savings_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          createdOrderNo,
          product_id,
          quantity,
          unit_price,
          0,
          0,
          totalPrice,
          0,
        ]
      );

      debugLog('Order item inserted', { productId: product_id, quantity });
    }

    await dbClient.query('COMMIT');
    debugLog('Order created successfully');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderNo: createdOrderNo,
      customerId,
    });
  } catch (error) {
    try {
      await dbClient.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[ERROR] Rollback failed:', rollbackError.message);
    }
    console.error('[ERROR] Create order error:', error);
    console.error('[ERROR] Error details:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint,
    });
    debugLog('Order creation failed', { errorMessage: error.message });
    res.status(500).json({
      success: false,
      message: 'Server error while creating order',
      error: error.message,
    });
  } finally {
    dbClient.release();
  }
});

module.exports = router;
