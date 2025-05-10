// backend/src/routes/symbols.js
import express from 'express';

const router = express.Router();

/**
 * GET /api/symbols
 * Haalt alle USDT perpetual‐futures symbolen op via de Bybit v5 REST API.
 */
router.get('/symbols', async (req, res) => {
  try {
    // Gebruik de v5‐endpoint voor all USDT (linear) contracts
    const resp = await fetch(
      'https://api.bybit.com/v5/market/instruments-info?category=linear'
    );
    if (!resp.ok) {
      throw new Error(`Bybit v5 API gaf status ${resp.status}`);
    }
    const data = await resp.json();
    // In v5 zit de lijst in data.result.list
    const list = (data.result?.list || [])
      .map(i => i.symbol)
      .filter(s => s.endsWith('USDT'));
    return res.json(list);
  } catch (err) {
    console.error('Error fetching symbols v5:', err);
    return res.status(500).json({ error: 'Could not fetch symbols' });
  }
});

export default router;
