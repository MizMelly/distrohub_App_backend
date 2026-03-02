const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const { verifyToken } = require('../middleware/auth');
const { query } = require('../config/db');

// Helper for debug logs
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} - ${message}`);
  if (data) console.log('[DEBUG] Data:', JSON.stringify(data, null, 2));
};

// =====================
// LOGIN
// =====================
router.post('/login', async (req, res) => {
  debugLog('Login request received', {
    email: req.body.email,
    bodyKeys: Object.keys(req.body),
  });

  const { email, password } = req.body;

  if (!email || !password) {
    debugLog('Missing email or password');
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    debugLog('Searching for user by email', { email });

    const result = await query(
      'SELECT name, accountno, email, pass FROM users WHERE email = $1',
      [email]
    );

    debugLog('User query result', { 
      rowCount: result.rowCount,
      found: result.rows.length > 0 
    });

    if (result.rows.length === 0) {
      debugLog('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];
    debugLog('User found - verifying password', { email: user.email });

    const isPasswordValid = await bcrypt.compare(password, user.pass);

    if (!isPasswordValid) {
      debugLog('Invalid password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    debugLog('Password valid - generating JWT');

    const payload = {
      email: user.email,
      accountno: user.accountno,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret-change-this-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    debugLog('Login successful - token generated');

    const { pass, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error('[ERROR] Login error:', err.stack);
    debugLog('Login failed due to server error');
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
});

// =====================
// FORGOT PASSWORD
// =====================
router.post('/forgot-password', async (req, res) => {
  debugLog('Forgot password request received', { email: req.body.email });

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const result = await query(
      'SELECT name, accountno, email, pass FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      debugLog('User not found for forgot password');
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    const user = result.rows[0];
    debugLog('User found - generating reset token');

    const secret = process.env.JWT_RESET_SECRET + user.pass;
    const resetToken = jwt.sign({ email: user.email }, secret, { expiresIn: '1h' });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const mailOptions = {
      from: `"DistroHub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nLink expires in 1 hour.\n\nIf you didn't request this, ignore this email.`,
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello,</p>
        <p>You (or someone else) requested to reset your password. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>DistroHub Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    debugLog('Reset email sent', { email });
    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (err) {
    console.error('[ERROR] Forgot password error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// RESET PASSWORD
// =====================
router.post('/reset-password', async (req, res) => {
  debugLog('Reset password request received');

  const { token, email, newPassword, confirmPassword } = req.body;

  if (!token || !email || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password too short' });
  }

  try {
    const result = await query(
      'SELECT name, accountno, email, pass FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    const secret = process.env.JWT_RESET_SECRET + user.pass;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      if (decoded.email !== email) throw new Error('Token mismatch');
    } catch (err) {
      debugLog('Invalid or expired reset token');
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    }

    debugLog('Reset token valid - updating password');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await query(
      'UPDATE users SET pass = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    debugLog('Password reset successful');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (err) {
    console.error('[ERROR] Reset password error:', err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// GET PROFILE
// =====================
router.get('/profile', verifyToken, async (req, res) => {
  debugLog('Get profile request received', { email: req.user.email });

  try {
    const result = await query(
      'SELECT sno, accountno, name, email, mobile, address FROM users WHERE email = $1',
      [req.user.email]
    );

    if (result.rows.length === 0) {
      debugLog('User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    debugLog('Profile fetched successfully');

    res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: user,
    });
  } catch (err) {
    console.error('[ERROR] Get profile error:', err.stack);
    debugLog('Get profile failed due to server error');
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
});

module.exports = router;