require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const ordersHistoryRoutes = require('./routes/orders-history');
const bankAccountsRoutes = require('./routes/bank-accounts');
// const productsRoutes = require('./routes/products'); // add later

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orders-history', ordersHistoryRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);
// app.use('/api/products', productsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'DistroHub Backend API is running' });
});

// Products route (temporary - move to separate file later)
app.get('/api/products', async (req, res) => {
  try {
    const result = await query('SELECT * FROM products ORDER BY id ASC');
    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (accessible from Android emulator via http://10.0.2.2:${PORT})`);

});
