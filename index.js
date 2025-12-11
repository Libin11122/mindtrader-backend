require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Health check
app.get('/', (req, res) => res.send('Mindtrader backend — healthy'));

// Start OAuth (safe: uses only client_id)
app.get('/auth', (req, res) => {
  const clientId = process.env.UPSTOX_API_KEY;
  const redirect = encodeURIComponent(process.env.UPSTOX_REDIRECT_URI);
  const url = `https://api.upstox.com/index/dialog/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirect}`;
  return res.redirect(url);
});

// Mount callback route
app.use('/upstox', require('./routes/upstox'));

// Simple logging
app.listen(port, () => console.log(`Server running on port ${port}`));
