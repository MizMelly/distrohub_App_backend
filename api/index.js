import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import all route handlers (adjust paths if needed)
import testDbHandler from '../src/routes/test-db.js';
import authRoutes from '../src/routes/auth.js';
import productsRoutes from '../src/routes/products.js';
import ordersRoutes from '../src/routes/orders.js';
import ordersHistoryRoutes from '../src/routes/orders-history.js';
import bankAccountsRoutes from '../src/routes/bank-accounts.js';
import uploadRoutes from '../src/routes/upload.js';

const app = express();

// Middleware – MUST be before routes
app.use(express.json());           // Parses JSON bodies – fixes "req.body undefined"
app.use(express.urlencoded({ extended: true })); // Optional: parses form data
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Something went wrong'
  });
});

// Startup logs
console.log('[START] api/index.js loaded');
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] JWT_SECRET exists:', !!process.env.JWT_SECRET);

// Export
export default app;