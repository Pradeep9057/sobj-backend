import cron from 'node-cron';
import { fetchAndStorePrices } from '../services/priceService.js';

// Run immediately on start, then hourly
fetchAndStorePrices()
  .then(() => {
    console.log('✅ Metal prices updated successfully on startup');
  })
  .catch((e) => {
    console.error('❌ Failed to update metal prices on startup:', e.message);
  });

// Schedule hourly updates (at minute 0 of every hour)
cron.schedule('0 * * * *', async () => {
  try {
    await fetchAndStorePrices();
    console.log('✅ Metal prices updated via cron job');
  } catch (e) {
    console.error('❌ Failed to update metal prices via cron:', e.message);
  }
});

console.log('📅 Price update cron job scheduled: runs every hour at minute 0');


