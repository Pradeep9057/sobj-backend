import pool from '../db.js';
import { calculateProductPrice } from './calculatePrice.js';

const q = (text, params) => pool.query(text, params);

/**
 * Create order from cart items
 * Note: Current database structure supports one product per order
 * For multiple items, we create separate orders or update schema
 */
export async function createOrder(userId, items) {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Calculate total for all items to determine shipping
  let orderSubtotal = 0;
  const orderItems = [];

  // Calculate price for each item
  for (const item of items) {
    const productResult = await q(
      `SELECT * FROM products WHERE id = $1`,
      [item.product_id || item.id]
    );

    if (productResult.rows.length === 0) {
      throw new Error(`Product ${item.product_id || item.id} not found`);
    }

    const product = productResult.rows[0];
    const quantity = item.qty || 1;

    // Calculate price for this product
    const priceData = await calculateProductPrice(product);
    const itemTotal = priceData.finalPrice * quantity;
    orderSubtotal += priceData.subtotal * quantity;

    orderItems.push({
      product_id: product.id,
      quantity,
      unit_price: priceData.finalPrice,
      total_price: itemTotal,
      price_breakdown: priceData
    });
  }

  // Calculate shipping based on order total
  const shippingCharges = orderSubtotal < 50000 ? orderSubtotal * 0.01 : 0;
  const orderTotal = orderSubtotal + shippingCharges;

  // Create separate order for each item (current DB structure)
  // Or create one order with first item and note others
  const createdOrders = [];
  
  for (const item of orderItems) {
    const orderResult = await q(
      `INSERT INTO orders (user_id, product_id, quantity, total_price, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id`,
      [userId, item.product_id, item.quantity, item.total_price]
    );

    createdOrders.push({
      id: orderResult.rows[0].id,
      product_id: item.product_id,
      quantity: item.quantity,
      total_price: item.total_price
    });
  }

  return {
    orders: createdOrders,
    total_price: orderTotal,
    item_count: orderItems.length
  };
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId, userId = null) {
  let query = `
    SELECT 
      o.id,
      o.user_id,
      o.product_id,
      o.quantity,
      o.total_price,
      o.created_at,
      u.name as user_name,
      u.email as user_email,
      p.name as product_name,
      p.image_url,
      p.weight,
      p.metal_type
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.id = $1
  `;
  const params = [orderId];

  if (userId) {
    query += ` AND o.user_id = $2`;
    params.push(userId);
  }

  const result = await q(query, params);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Get user orders
 */
export async function getUserOrders(userId) {
  const result = await q(
    `SELECT 
      o.id,
      o.product_id,
      o.quantity,
      o.total_price,
      o.created_at,
      p.name as product_name,
      p.image_url
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC`,
    [userId]
  );

  return result.rows;
}

