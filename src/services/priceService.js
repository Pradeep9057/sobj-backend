// import pool from '../db.js';
// import axios from 'axios';

// export async function getLatestPrices() {
//   const [rows] = await pool.query(
//     'SELECT metal, rate_per_gram, updated_at FROM metal_prices ORDER BY updated_at DESC'
//   );
//   // Return latest distinct by metal
//   const map = new Map();
//   for (const r of rows) {
//     if (!map.has(r.metal)) map.set(r.metal, r);
//   }
//   const result = Array.from(map.values());
//   if (result.length === 0) {
//     await fetchAndStorePrices();
//     const [rows2] = await pool.query(
//       'SELECT metal, rate_per_gram, updated_at FROM metal_prices ORDER BY updated_at DESC'
//     );
//     const map2 = new Map();
//     for (const r of rows2) { if (!map2.has(r.metal)) map2.set(r.metal, r); }
//     return Array.from(map2.values());
//   }
//   return result;
// }

// export async function setPrice(metal, rate) {
//   await pool.query(
//     'INSERT INTO metal_prices (metal, rate_per_gram) VALUES (?, ?)',
//     [metal, rate]
//   );
// }

// export async function fetchAndStorePrices() {
//   const provider = (process.env.GOLD_API_PROVIDER || 'metals-api').toLowerCase();
//   const apiKey = process.env.GOLD_API_KEY;
  
//   if (!apiKey) {
//     console.error('❌ GOLD_API_KEY is not set in environment variables. Cannot fetch prices.');
//     throw new Error('GOLD_API_KEY environment variable is required');
//   }

//   try {
//     if (provider === 'metals-api' || provider === 'metalsapi') {
//       const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=INR&symbols=XAU,XAG`;
//       const { data } = await axios.get(url);
      
//       if (!data.success && data.error) {
//         throw new Error(`Metals API Error: ${data.error.info || data.error.message || 'Unknown error'}`);
//       }
      
//       if (!data.rates || !data.rates.XAU || !data.rates.XAG) {
//         throw new Error('Invalid response from Metals API: Missing rates data');
//       }
      
//       const inrPerOunceGold = data.rates.XAU;
//       const inrPerOunceSilver = data.rates.XAG;
//       const gramsPerTroyOunce = 31.1034768;
//       const goldPerGram = inrPerOunceGold / gramsPerTroyOunce;
//       const silverPerGram = inrPerOunceSilver / gramsPerTroyOunce;
//       const gold22 = goldPerGram * (22 / 24);
      
//       await setPrice('gold_24k', Number(goldPerGram.toFixed(2)));
//       await setPrice('gold_22k', Number(gold22.toFixed(2)));
//       await setPrice('silver', Number(silverPerGram.toFixed(2)));
      
//       console.log(`✅ Prices updated: Gold 24K: ₹${Number(goldPerGram.toFixed(2))}/g, Gold 22K: ₹${Number(gold22.toFixed(2))}/g, Silver: ₹${Number(silverPerGram.toFixed(2))}/g`);
//     } else if (provider === 'goldapi' || provider === 'goldapi.io' || provider === 'goldapiio') {
//       // goldapi.io provider
//       const headers = { 
//         'x-access-token': apiKey, 
//         'Content-Type': 'application/json' 
//       };
      
//       let goldRes, silverRes;
//       try {
//         [goldRes, silverRes] = await Promise.all([
//           axios.get('https://www.goldapi.io/api/XAU/INR', { headers }),
//           axios.get('https://www.goldapi.io/api/XAG/INR', { headers })
//         ]);
//       } catch (apiError) {
//         const errorDetail = apiError.response?.data || apiError.message;
//         throw new Error(`GoldAPI.io request failed: ${JSON.stringify(errorDetail)}`);
//       }
      
//       // Check for API errors in response
//       if (goldRes.data?.error) {
//         throw new Error(`GoldAPI.io Error: ${goldRes.data.error.message || JSON.stringify(goldRes.data.error)}`);
//       }
//       if (silverRes.data?.error) {
//         throw new Error(`GoldAPI.io Error: ${silverRes.data.error.message || JSON.stringify(silverRes.data.error)}`);
//       }
      
//       // Validate response structure
//       if (!goldRes.data || typeof goldRes.data.price === 'undefined') {
//         console.error('Gold API Response:', JSON.stringify(goldRes.data, null, 2));
//         throw new Error('Invalid response from GoldAPI.io (Gold): Missing price field');
//       }
//       if (!silverRes.data || typeof silverRes.data.price === 'undefined') {
//         console.error('Silver API Response:', JSON.stringify(silverRes.data, null, 2));
//         throw new Error('Invalid response from GoldAPI.io (Silver): Missing price field');
//       }
      
//       // Price from goldapi.io is in INR per troy ounce
//       const gramsPerTroyOunce = 31.1034768;
//       const goldPerOuncePrice = Number(goldRes.data.price);
//       const silverPerOuncePrice = Number(silverRes.data.price);
      
//       if (isNaN(goldPerOuncePrice) || isNaN(silverPerOuncePrice)) {
//         throw new Error(`Invalid price values: Gold=${goldRes.data.price}, Silver=${silverRes.data.price}`);
//       }
      
//       // Convert from per ounce to per gram
//       const goldPerGram = goldPerOuncePrice / gramsPerTroyOunce;
//       const silverPerGram = silverPerOuncePrice / gramsPerTroyOunce;
//       const gold22 = goldPerGram * (22 / 24);
      
//       await setPrice('gold_24k', Number(goldPerGram.toFixed(2)));
//       await setPrice('gold_22k', Number(gold22.toFixed(2)));
//       await setPrice('silver', Number(silverPerGram.toFixed(2)));
      
//       console.log(`✅ Prices updated via GoldAPI.io:`);
//       console.log(`   Gold 24K: ₹${Number(goldPerGram.toFixed(2))}/g`);
//       console.log(`   Gold 22K: ₹${Number(gold22.toFixed(2))}/g`);
//       console.log(`   Silver: ₹${Number(silverPerGram.toFixed(2))}/g`);
//     } else {
//       throw new Error(`Unknown provider: ${provider}. Use 'metals-api' or 'goldapi'`);
//     }
//   } catch (e) {
//     const errorMsg = e.response?.data?.error?.info || e.response?.data?.message || e.message || 'Unknown error';
//     console.error('❌ fetchAndStorePrices error:', errorMsg);
//     console.error('Full error:', e.response?.data || e);
//     throw new Error(`Failed to fetch prices: ${errorMsg}`);
//   }
// }


import pool from '../db.js';
import axios from 'axios';

// Short helper for clean code
const q = (sql, params) => pool.query(sql, params);

// ==========================================================
// GET LATEST PRICES
// ==========================================================

export async function getLatestPrices() {
  const result = await q(
    `SELECT metal, rate_per_gram, updated_at 
     FROM metal_prices 
     ORDER BY updated_at DESC`
  );

  const rows = result.rows;

  // Return latest distinct metal
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.metal)) map.set(r.metal, r);
  }

  const resultList = [...map.values()];

  if (resultList.length === 0) {
    // No prices → fetch new ones
    await fetchAndStorePrices();

    const result2 = await q(
      `SELECT metal, rate_per_gram, updated_at 
       FROM metal_prices 
       ORDER BY updated_at DESC`
    );

    const map2 = new Map();
    for (const r of result2.rows) {
      if (!map2.has(r.metal)) map2.set(r.metal, r);
    }

    return [...map2.values()];
  }

  return resultList;
}

// ==========================================================
// INSERT PRICE (PostgreSQL version)
// ==========================================================

export async function setPrice(metal, rate) {
  await q(
    `INSERT INTO metal_prices (metal, rate_per_gram)
     VALUES ($1, $2)`,
    [metal, rate]
  );
}

// ==========================================================
// FETCH + STORE METAL PRICES
// ==========================================================

export async function fetchAndStorePrices() {
  const provider = (process.env.GOLD_API_PROVIDER || 'metals-api').toLowerCase();
  const apiKey = process.env.GOLD_API_KEY;

  if (!apiKey) {
    console.error('❌ GOLD_API_KEY is not set.');
    throw new Error('GOLD_API_KEY environment variable is required');
  }

  try {
    // ========================================================
    // 1) METALS-API PROVIDER
    // ========================================================
    if (provider === 'metals-api' || provider === 'metalsapi') {
      const url = `https://metals-api.com/api/latest?access_key=${apiKey}&base=INR&symbols=XAU,XAG`;
      const { data } = await axios.get(url);

      if (!data.success && data.error) {
        throw new Error(`Metals API Error: ${data.error.info || data.error.message}`);
      }

      if (!data.rates?.XAU || !data.rates?.XAG) {
        throw new Error('Invalid Metals API response: Missing rate data');
      }

      const gramsPerOunce = 31.1034768;
      const goldPerGram = data.rates.XAU / gramsPerOunce;
      const silverPerGram = data.rates.XAG / gramsPerOunce;
      const gold22 = goldPerGram * (22 / 24);

      await setPrice('gold_24k', Number(goldPerGram.toFixed(2)));
      await setPrice('gold_22k', Number(gold22.toFixed(2)));
      await setPrice('silver', Number(silverPerGram.toFixed(2)));

      console.log(`✅ MetalsAPI Updated Prices`);
      return;
    }

    // ========================================================
    // 2) GOLDAPI.IO PROVIDER
    // ========================================================
    if (['goldapi', 'goldapi.io', 'goldapiio'].includes(provider)) {
      const headers = {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      };

      let goldRes, silverRes;

      try {
        [goldRes, silverRes] = await Promise.all([
          axios.get('https://www.goldapi.io/api/XAU/INR', { headers }),
          axios.get('https://www.goldapi.io/api/XAG/INR', { headers })
        ]);
      } catch (apiError) {
        const detail = apiError.response?.data || apiError.message;
        throw new Error(`GoldAPI.io request failed: ${JSON.stringify(detail)}`);
      }

      if (goldRes.data.error) {
        throw new Error(`GoldAPI.io Gold Error: ${JSON.stringify(goldRes.data.error)}`);
      }
      if (silverRes.data.error) {
        throw new Error(`GoldAPI.io Silver Error: ${JSON.stringify(silverRes.data.error)}`);
      }

      if (!('price' in goldRes.data) || !('price' in silverRes.data)) {
        throw new Error('Invalid GoldAPI.io response: Missing price');
      }

      const gramsPerOunce = 31.1034768;
      const goldPerGram = Number(goldRes.data.price) / gramsPerOunce;
      const silverPerGram = Number(silverRes.data.price) / gramsPerOunce;
      const gold22 = goldPerGram * (22 / 24);

      await setPrice('gold_24k', Number(goldPerGram.toFixed(2)));
      await setPrice('gold_22k', Number(gold22.toFixed(2)));
      await setPrice('silver', Number(silverPerGram.toFixed(2)));

      console.log(`✅ GoldAPI.io Updated Prices`);
      return;
    }

    // ========================================================
    // UNKNOWN PROVIDER
    // ========================================================
    throw new Error(`Unknown provider '${provider}'. Use 'metals-api' or 'goldapi'.`);

  } catch (e) {
    const msg =
      e.response?.data?.error?.info ||
      e.response?.data?.message ||
      e.message ||
      'Unknown error';

    console.error('❌ fetchAndStorePrices error:', msg);
    console.error('Full error:', e.response?.data || e);
    throw new Error(`Failed to fetch prices: ${msg}`);
  }
}
