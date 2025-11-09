import { Router } from 'express';
import axios from 'axios';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import * as svc from '../services/priceService.js';

const router = Router();

router.get('/', async (req, res) => {
  const data = await svc.getLatestPrices();
  res.json(data);
});

router.post('/update', requireAuth, requireAdmin, async (req, res) => {
  const { metal, rate_per_gram } = req.body;
  await svc.setPrice(metal, rate_per_gram);
  res.json({ ok: true });
});

router.post('/refresh', requireAuth, requireAdmin, async (req, res) => {
  try {
    await svc.fetchAndStorePrices();
    const updatedPrices = await svc.getLatestPrices();
    res.json({ 
      ok: true, 
      message: 'Prices refreshed successfully',
      prices: updatedPrices 
    });
  } catch (e) {
    res.status(500).json({ 
      ok: false, 
      message: e.message || 'Error refreshing prices',
      error: e.message
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const prices = await svc.getLatestPrices();
    const hasApiKey = !!process.env.GOLD_API_KEY;
    const provider = process.env.GOLD_API_PROVIDER || 'metals-api';
    const cronEnabled = process.env.DISABLE_PRICE_CRON !== 'true';
    const apiKeyPreview = process.env.GOLD_API_KEY 
      ? `${process.env.GOLD_API_KEY.substring(0, 10)}...` 
      : 'Not set';
    
    const envNote = !cronEnabled 
      ? 'Cron is disabled. Set DISABLE_PRICE_CRON=false in .env to enable hourly updates.'
      : 'Cron is enabled. Prices update hourly at minute 0.';
    
    res.json({
      ok: true,
      hasApiKey,
      apiKeyPreview,
      provider,
      cronEnabled,
      note: envNote,
      prices: prices.map(p => ({
        metal: p.metal,
        rate: p.rate_per_gram,
        updated_at: p.updated_at
      })),
      latestUpdate: prices.length > 0 
        ? prices.reduce((latest, p) => {
            const time = new Date(p.updated_at).getTime();
            return time > latest ? time : latest;
          }, 0)
        : null,
      latestUpdateFormatted: prices.length > 0 
        ? new Date(prices.reduce((latest, p) => {
            const time = new Date(p.updated_at).getTime();
            return time > latest ? time : latest;
          }, 0)).toLocaleString()
        : 'Never'
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

router.get('/test-api', requireAuth, requireAdmin, async (req, res) => {
  try {
    const provider = process.env.GOLD_API_PROVIDER || 'metals-api';
    const apiKey = process.env.GOLD_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        ok: false, 
        message: 'GOLD_API_KEY is not set in environment variables' 
      });
    }
    
    if (provider === 'goldapi' || provider === 'goldapi.io' || provider === 'goldapiio') {
      const headers = { 
        'x-access-token': apiKey, 
        'Content-Type': 'application/json' 
      };
      
      try {
        const testRes = await axios.get('https://www.goldapi.io/api/XAU/INR', { headers });
        res.json({
          ok: true,
          message: 'API connection successful',
          provider: 'goldapi.io',
          response: {
            price: testRes.data.price,
            currency: testRes.data.currency,
            timestamp: testRes.data.timestamp,
            pricePerGram: (testRes.data.price / 31.1034768).toFixed(2)
          }
        });
      } catch (apiError) {
        res.status(apiError.response?.status || 500).json({
          ok: false,
          message: 'API connection failed',
          error: apiError.response?.data || apiError.message,
          statusCode: apiError.response?.status
        });
      }
    } else {
      // Test metals-api
      const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=INR&symbols=XAU,XAG`;
      try {
        const testRes = await axios.get(url);
        res.json({
          ok: true,
          message: 'API connection successful',
          provider: 'metals-api',
          response: testRes.data
        });
      } catch (apiError) {
        res.status(apiError.response?.status || 500).json({
          ok: false,
          message: 'API connection failed',
          error: apiError.response?.data || apiError.message,
          statusCode: apiError.response?.status
        });
      }
    }
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

export default router;


