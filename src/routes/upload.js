const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');

// Helper for debug logs
const debugLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG] ${timestamp} - ${message}`);
  if (data) console.log('[DEBUG] Data:', JSON.stringify(data, null, 2));
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save to public/uploads directory
    const uploadDir = path.join(__dirname, '../../public/uploads/payment_proofs');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `proof_${timestamp}_${randomStr}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
  },
});

// =====================
// UPLOAD PAYMENT PROOF
// =====================
router.post('/', verifyToken, upload.single('payment_proof'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Construct the public URL
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/payment_proofs/${req.file.filename}`;

    debugLog('Payment proof uploaded successfully', {
      filename: req.file.filename,
      size: req.file.size,
      url: imageUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Payment proof uploaded successfully',
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error('[ERROR] Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload payment proof',
      error: error.message,
    });
  }
});

module.exports = router;
