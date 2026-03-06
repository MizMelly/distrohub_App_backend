// api/index.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import all your route handlers from src/routes/
import testDbHandler from '../src/routes/test-db.js';
import authRoutes from '../src/routes/auth.js';
import productsRoutes from '../src/routes/products.js';
import ordersRoutes from '../src/routes/orders.js';
import ordersHistoryRoutes from '../src/routes/orders-history.js';
import bankAccountsRoutes from '../src/routes/bank-accounts.js';
import uploadRoutes from '../src/routes/upload.js';

const app = express();

// Middleware
app.use(helmet());              // security headers
app.use(morgan('dev'));         // logging
app.use(cors({
  origin: '*',                  // allow all for now (tighten later for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Mount all routes under /api prefix
app.use('/api/test-db', testDbHandler);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders-history', ordersHistoryRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);
app.use('/api/upload', uploadRoutes);

// Root route (prevents default Vercel 404 page)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'DistroHub Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    vercel: !!process.env.VERCEL,
    uptime: process.uptime()
  });
});

// Global 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler (prevents crashes in serverless)
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server'
  });
});

console.log('[START] api/index.js loaded');
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] JWT_SECRET exists:', !!process.env.JWT_SECRET);

// In each route mount (example for test-db)
app.use('/api/test-db', (req, res, next) => {
  console.log('[TEST-DB] Request incoming');
  testDbHandler(req, res, next);
});

// Export the app for Vercel serverless functions
export default app;