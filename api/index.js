// api/index.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import route handlers (adjust paths if your folder structure is different)
import testDbHandler from '../src/routes/test-db.js';
import authRoutes from '../src/routes/auth.js';
// import productsRoutes from '../src/routes/products.js';
// import ordersRoutes from '../src/routes/orders.js';
// import ordersHistoryRoutes from '../src/routes/orders-history.js';
// import bankAccountsRoutes from '../src/routes/bank-accounts.js';
// import uploadRoutes from '../src/routes/upload.js';

const app = express();

// Middleware
app.use(helmet());                  // Security headers
app.use(morgan('dev'));             // Request logging
app.use(cors({
  origin: '*',                      // Allow all for development (change to your Flutter web URL in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Mount all routes under /api prefix
app.use('/api/test-db', (req, res, next) => {
  console.log('[TEST-DB] Request incoming:', req.method, req.originalUrl);
  testDbHandler(req, res, next);
});

app.use('/api/test-db', testDbHandler);
app.use('/api/auth', authRoutes);

// app.use('/api/products', productsRoutes);
// app.use('/api/orders', ordersRoutes);
// app.use('/api/orders-history', ordersHistoryRoutes);
// app.use('/api/bank-accounts', bankAccountsRoutes);
// app.use('/api/upload', uploadRoutes);

// Root route (prevents Vercel default 404 page)
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

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler (prevents silent crashes in serverless)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong on the server'
  });
});

// Startup logs (visible in Vercel Functions logs)
console.log('[START] api/index.js loaded');
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Export for Vercel serverless functions
export default app;