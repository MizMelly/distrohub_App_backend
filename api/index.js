// api/index.js

import express from 'express';
import cors from 'cors';

// Import your test route (adjust path if needed)
import testDbHandler from '../src/routes/test-db.js';  
import auth from '../src/routes/auth.js'; 
import products from '../src/routes/products.js';
import orders from '../src/routes/orders.js';
import ordersHistory from '../src/routes/orders-history.js';
import bankAccounts from '../src/routes/bank-accounts.js';
import upload from '../src/routes/upload.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount the test-db route
app.use('/api/test-db', testDbHandler);
app.use('/api/auth', auth); 
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/orders-history', ordersHistory);
app.use('/api/bank-accounts', bankAccounts); 
app.use('/api/upload', upload); 
// Optional: root health check (prevents default Vercel 404 page)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'DistroHub Backend API is running on Vercel',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// Required for Vercel serverless
export default app;