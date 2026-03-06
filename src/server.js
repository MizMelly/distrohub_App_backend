require('dotenv').config(); // only needed locally – Vercel ignores it

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import your routes
const testDbRoute = require('./routes/test-db');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const ordersHistoryRoutes = require('./routes/orders-history');
const bankAccountsRoutes = require('./routes/bank-accounts');

const app = express();

// Security & logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Mount all routes under /api prefix (standard for APIs)
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders-history', ordersHistoryRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);
app.use('/api/test-db', testDbRoute);

// Root route for basic health check (optional but nice)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'DistroHub Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Export for Vercel serverless functions
module.exports = app;