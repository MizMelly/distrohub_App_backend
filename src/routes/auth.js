const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);
router.get('/profile', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Protected route example
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Protected profile route',
    user: req.user
  });
});

// Add this route
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user  // This comes from verifyToken middleware
  });
});

module.exports = router;