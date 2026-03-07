import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/api/ping', (req, res) => {
  res.json({ pong: true });
});

export default app;