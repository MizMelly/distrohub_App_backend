import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  // 1. Get Authorization header
  const authHeader = req.headers.authorization;

  // 2. Check if header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Missing or invalid Authorization header');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: No token provided or invalid format. Expected: Bearer <token>',
    });
  }

  // 3. Extract token
  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    console.warn('[AUTH] Token not found after Bearer prefix');
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Token missing in header',
    });
  }

  // 4. Verify token
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('[AUTH FATAL] JWT_SECRET is not set in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    const decoded = jwt.verify(token, secret);

    // 5. Attach user data to request object
    req.user = decoded;

    // Optional: log successful verification (remove in production if too noisy)
    console.log('[AUTH] Token verified for user:', decoded.email || decoded.accountno || 'unknown');

    next(); // proceed to protected route
  } catch (err) {
    console.error('[AUTH] Token verification failed:', {
      name: err.name,
      message: err.message,
      expiredAt: err.expiredAt,
    });

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token signature or format',
      });
    }

    // Fallback for any other JWT error
    return res.status(401).json({
      success: false,
      message: 'Authentication failed: Invalid token',
    });
  }
};