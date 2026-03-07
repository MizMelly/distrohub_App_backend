// Start with only ping and root
import express from 'express';

const app = express();

app.get('/', (req, res) => res.json({ status: 'alive' }));
app.get('/api/ping', (req, res) => res.json({ pong: true }));

// Add one route at a time, test, then add next
// import testDb from '../src/routes/test-db.js';
// app.use('/api/test-db', testDb);

// ... add auth, products, etc. one by one

export default app;