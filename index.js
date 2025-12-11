require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Simple health
app.get('/', (req, res) => res.send('Mindtrader backend — healthy'));

// Start OAuth (redirect user to Upstox login)
app.get('/auth', (req, res) => {
  const clientId = process.env.UPSTOX_API_KEY;
  const redirect = encodeURIComponent(process.env.UPSTOX_REDIRECT_URI);
  // Upstox authorization URL (common pattern) - adjust if Upstox instructs a different path
  const url = `https://api.upstox.com/index/dialog/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirect}`;
  return res.redirect(url);
});

app.use('/upstox', require('./routes/upstox'));

app.listen(port, () => console.log(`Server running on port ${port}`));
