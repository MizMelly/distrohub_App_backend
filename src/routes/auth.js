const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', login);

// Protected route example
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Protected profile route',
    user: req.user
  });
});

module.exports = router;