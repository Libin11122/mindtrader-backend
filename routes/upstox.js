const express = require('express');
const axios = require('axios');
const { Client } = require('pg'); 
const router = express.Router();

function mask(s) {
  if (!s) return '';
  return s.slice(0,6) + '...' + s.slice(-6);
}

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');

  try {
    const data = new URLSearchParams({
      code,
      client_id: process.env.UPSTOX_API_KEY,
      client_secret: process.env.UPSTOX_API_SECRET,
      redirect_uri: process.env.UPSTOX_REDIRECT_URI,
      grant_type: 'authorization_code'
    }).toString();

    const resp = await axios.post(
      'https://api.upstox.com/v2/login/authorization/token',
      data,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = resp.data;

    // If DATABASE_URL is set, save token to Postgres (recommended)
    if (process.env.DATABASE_URL) {
      const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS tokens (
          id SERIAL PRIMARY KEY,
          provider TEXT,
          access_token TEXT,
          refresh_token TEXT,
          expires_in INTEGER,
          obtained_at TIMESTAMP DEFAULT now()
        )
      `);
      await client.query(
        `INSERT INTO tokens(provider, access_token, refresh_token, expires_in) VALUES($1,$2,$3,$4)`,
        ['upstox', token.access_token, token.refresh_token || null, token.expires_in || null]
      );
      await client.end();
      return res.send('Token received and saved securely ✔');
    }

    // Otherwise: only log masked token for temporary testing (not persistent)
    console.log('ACCESS_TOKEN:', mask(token.access_token));
    if (token.refresh_token) console.log('REFRESH_TOKEN:', mask(token.refresh_token));
    return res.send('Token received (not saved — set DATABASE_URL to persist securely)');
  }
  catch (err) {
    console.error('Token Error:', err.response?.data || err.message || err.toString());
    return res.status(500).send('Error exchanging code for token — check logs.');
  }
});

module.exports = router;
