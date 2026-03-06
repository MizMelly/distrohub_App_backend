// api/index.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import your route modules (from routes/ folder)
const authRoutes = require('../routes/auth');
const productsRoutes = require('../routes/products');
const ordersRoutes = require('../routes/orders');
const ordersHistoryRoutes = require('../routes/orders-history');
const bankAccountsRoutes = require('../routes/bank-accounts');
const testDbRoute = require('../routes/test-db');

// Create the Express app
const app = express();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Mount all your routes under /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders-history', ordersHistoryRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);
app.use('/api/test-db', testDbRoute);

// Optional root route (for basic health check at /)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'DistroHub Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
  });
});

// Export the app for Vercel serverless
module.exports = app;