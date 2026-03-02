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

// =====================
// GET USER ORDERS
// =====================
router.get('/', verifyToken, async (req, res) => {
  debugLog('Fetch orders request received', { email: req.user.email });

  try {
    // Get customer ID from email
    const userResult = await query(
      'SELECT sno FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const customerId = userResult.rows[0].sno;

    // Fetch all orders for this customer
    const ordersResult = await query(
      `SELECT 
        order_no,
        order_date,
        status,
        total_amount,
        amount_paid,
        balance_due,
        payment_type,
        notes
      FROM customer_orders
      WHERE customer_id = $1
      ORDER BY order_date DESC`,
      [customerId]
    );

    const orders = ordersResult.rows;

    debugLog('Orders fetched', { customerId, orderCount: orders.length });

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
    });
  } catch (error) {
    console.error('[ERROR] Fetch orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders',
      error: error.message,
    });
  }
});

// =====================
// GET ORDER DETAILS (with items)
// =====================
router.get('/:orderNo', verifyToken, async (req, res) => {
  const { orderNo } = req.params;
  debugLog('Fetch order details request', { orderNo, email: req.user.email });

  try {
    // Get customer ID from email
    const userResult = await query(
      'SELECT sno FROM users WHERE email = $1',
      [req.user.email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const customerId = userResult.rows[0].sno;

    // Fetch order details
    const orderResult = await query(
      `SELECT 
        order_no,
        customer_id,
        order_date,
        status,
        total_amount,
        amount_paid,
        balance_due,
        payment_type,
        notes
      FROM customer_orders
      WHERE order_no = $1 AND customer_id = $2`,
      [orderNo, customerId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = orderResult.rows[0];

    // Fetch order items
    const itemsResult = await query(
      `SELECT 
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.name as product_name,
        p.image_urls
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1`,
      [orderNo]
    );

    // Fetch payment details
    const paymentResult = await query(
      `SELECT 
        payment_method,
        reference_no,
        bank_name,
        recipient_bank_name,
        recipient_account_number,
        recipient_account_name,
        payment_proof,
        payment_date
      FROM customer_payments
      WHERE order_no = $1`,
      [orderNo]
    );

    const payment = paymentResult.rows[0] || null;

    debugLog('Order details fetched', { orderNo, itemCount: itemsResult.rows.length });

    res.status(200).json({
      success: true,
      message: 'Order details fetched successfully',
      data: {
        order,
        items: itemsResult.rows,
        payment,
      },
    });
  } catch (error) {
    console.error('[ERROR] Fetch order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order details',
      error: error.message,
    });
  }
});

module.exports = router;
