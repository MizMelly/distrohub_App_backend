// api/index.js

import express from 'express';
import cors from 'cors';

// Import your test route (adjust path if needed)
import testDbHandler from '../src/routes/test-db.js';  


const app = express();

app.use(cors());
app.use(express.json());

// Mount the test-db route
app.use('/api/test-db', testDbHandler);

 // Example for auth routes

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