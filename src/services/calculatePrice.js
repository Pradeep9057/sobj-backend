// import pool from '../db.js';

// /**
//  * Calculate product price based on metal rates, weight, making charges, shipping, and box charges
//  */
// export async function calculateProductPrice(product, orderTotal = null) {
//   // Get metal rates
//   const [priceRows] = await pool.query(
//     'SELECT metal, rate_per_gram FROM metal_prices ORDER BY updated_at DESC'
//   );
  
//   const metalRates = new Map();
//   for (const row of priceRows) {
//     if (!metalRates.has(row.metal)) {
//       metalRates.set(row.metal, Number(row.rate_per_gram));
//     }
//   }

//   // Determine metal key based on metal_type and purity
//   let metalKey = null;
//   if (product.metal_type === 'gold') {
//     if (product.purity === '24K') metalKey = 'gold_24k';
//     else metalKey = 'gold_22k'; // Default to 22K
//   } else if (product.metal_type === 'silver') {
//     metalKey = 'silver';
//   }

//   const metalRate = metalRates.get(metalKey) || 0;
//   const weight = Number(product.weight) || 0;

//   // Base price = metal rate × weight
//   const basePrice = metalRate * weight;

//   // Calculate making charges based on type
//   let makingCharges = 0;
//   const makingChargesType = product.making_charges_type || 'fixed';
//   const makingChargesValue = Number(product.making_charges_value) || 0;

//   if (makingChargesType === 'percentage') {
//     makingCharges = (makingChargesValue / 100) * basePrice;
//   } else if (makingChargesType === 'per_gram') {
//     makingCharges = makingChargesValue * weight;
//   } else {
//     // Fixed
//     makingCharges = makingChargesValue;
//   }

//   // Subtotal before shipping and box charges
//   const subtotalBeforeExtras = basePrice + makingCharges;

//   // Calculate box charges if box_sku is provided
//   let boxCharges = 0;
//   if (product.box_sku) {
//     const [boxRows] = await pool.query(
//       'SELECT rate FROM item_master WHERE sku = ? AND is_active = TRUE',
//       [product.box_sku]
//     );
//     if (boxRows.length > 0) {
//       boxCharges = Number(boxRows[0].rate) || 0;
//     }
//   }

//   // Calculate shipping charges (1% for orders < ₹50,000)
//   // If orderTotal is provided, use it; otherwise calculate for this single product
//   const subtotalForShipping = orderTotal !== null ? orderTotal : subtotalBeforeExtras;
//   let shippingCharges = 0;
//   if (subtotalForShipping < 50000) {
//     shippingCharges = subtotalBeforeExtras * 0.01; // 1% of subtotal before extras
//   }

//   // Subtotal = base + making charges + box charges
//   const subtotal = subtotalBeforeExtras + boxCharges;

//   // GST (3%) on subtotal
//   const gst = subtotal * 0.03;

//   // Final price = subtotal + GST + shipping
//   const finalPrice = subtotal + gst + shippingCharges;

//   return {
//     metalRate,
//     basePrice: Number(basePrice.toFixed(2)),
//     makingCharges: Number(makingCharges.toFixed(2)),
//     boxCharges: Number(boxCharges.toFixed(2)),
//     shippingCharges: Number(shippingCharges.toFixed(2)),
//     subtotal: Number(subtotal.toFixed(2)),
//     gst: Number(gst.toFixed(2)),
//     finalPrice: Number(finalPrice.toFixed(2))
//   };
// }

import pool from '../db.js';

/**
 * Calculate product price based on metal rates, weight, making charges, shipping, and box charges
 */
export async function calculateProductPrice(product, orderTotal = null) {
  // 1. Fetch metal rates (PostgreSQL syntax)
  const priceResult = await pool.query(
    `SELECT metal, rate_per_gram 
     FROM metal_prices 
     ORDER BY updated_at DESC`
  );

  const priceRows = priceResult.rows;

  const metalRates = new Map();
  for (const row of priceRows) {
    if (!metalRates.has(row.metal)) {
      metalRates.set(row.metal, Number(row.rate_per_gram));
    }
  }

  // 2. Determine metal key
  let metalKey = null;
  if (product.metal_type === 'gold') {
    metalKey = product.purity === '24K' ? 'gold_24k' : 'gold_22k';
  } else if (product.metal_type === 'silver') {
    metalKey = 'silver';
  }

  const metalRate = metalRates.get(metalKey) || 0;
  const weight = Number(product.weight) || 0;

  // 3. Base price
  const basePrice = metalRate * weight;

  // 4. Making charges
  let makingCharges = 0;
  const makingType = product.making_charges_type || 'fixed';
  const makingValue = Number(product.making_charges_value) || 0;

  if (makingType === 'percentage') {
    makingCharges = (makingValue / 100) * basePrice;
  } else if (makingType === 'per_gram') {
    makingCharges = makingValue * weight;
  } else {
    makingCharges = makingValue;
  }

  const subtotalBeforeExtras = basePrice + makingCharges;

  // 5. Box charges (PostgreSQL syntax)
  let boxCharges = 0;

  if (product.box_sku) {
    const boxResult = await pool.query(
      `SELECT rate 
       FROM item_master 
       WHERE sku = $1 AND is_active = TRUE`,
      [product.box_sku]
    );

    if (boxResult.rows.length > 0) {
      boxCharges = Number(boxResult.rows[0].rate) || 0;
    }
  }

  // 6. Shipping charges
  const subtotalForShipping =
    orderTotal !== null ? orderTotal : subtotalBeforeExtras;

  let shippingCharges = 0;
  if (subtotalForShipping < 50000) {
    shippingCharges = subtotalBeforeExtras * 0.01;
  }

  // 7. Subtotal, GST, final price
  const subtotal = subtotalBeforeExtras + boxCharges;
  const gst = subtotal * 0.03;
  const finalPrice = subtotal + gst + shippingCharges;

  return {
    metalRate,
    basePrice: Number(basePrice.toFixed(2)),
    makingCharges: Number(makingCharges.toFixed(2)),
    boxCharges: Number(boxCharges.toFixed(2)),
    shippingCharges: Number(shippingCharges.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    finalPrice: Number(finalPrice.toFixed(2)),
  };
}
