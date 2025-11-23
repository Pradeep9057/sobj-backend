import pool from '../db.js';
import { calculateProductPrice } from './calculatePrice.js';

const q = (text, params) => pool.query(text, params);

/**
 * Create order from cart items with address and payment info
 */
export async function createOrder(userId, items, shippingAddress, razorpayOrderId = null) {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  if (!shippingAddress) {
    throw new Error('Shipping address is required');
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
  const gst = orderSubtotal * 0.03;
  const orderTotal = orderSubtotal + gst + shippingCharges;

  // Create single order with all items
  const addressString = JSON.stringify(shippingAddress);
  
  const orderResult = await q(
    `INSERT INTO orders (user_id, total_price, status, payment_status, shipping_address, razorpay_order_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING id`,
    [userId, orderTotal, 'pending', 'pending', addressString, razorpayOrderId]
  );

  const orderId = orderResult.rows[0].id;

  // Create order items (if table exists)
  try {
    for (const item of orderItems) {
      await q(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]
      );
    }
  } catch (err) {
    // If order_items table doesn't exist, create order with first item (legacy support)
    if (orderItems.length > 0) {
      await q(
        `UPDATE orders SET product_id = $1, quantity = $2 WHERE id = $3`,
        [orderItems[0].product_id, orderItems[0].quantity, orderId]
      );
    }
  }

  // Add status history (if table exists)
  try {
    await q(
      `INSERT INTO order_status_history (order_id, status, notes)
       VALUES ($1, $2, $3)`,
      [orderId, 'pending', 'Order created']
    );
  } catch (err) {
    // Table might not exist yet
    console.warn('order_status_history table not found, skipping history entry');
  }

  return {
    id: orderId,
    total_price: orderTotal,
    items: orderItems,
    status: 'pending',
    payment_status: 'pending'
  };
}

/**
 * Get order by ID with items and status history
 */
export async function getOrderById(orderId, userId = null) {
  let query = `
    SELECT 
      o.id,
      o.user_id,
      o.total_price,
      o.status,
      o.payment_status,
      o.payment_id,
      o.razorpay_order_id,
      o.razorpay_payment_id,
      o.shipping_address,
      o.tracking_number,
      o.created_at,
      o.updated_at,
      u.name as user_name,
      u.email as user_email
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
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

  const order = result.rows[0];

  // Get order items (try new schema first, fallback to old schema)
  try {
    const itemsResult = await q(
      `SELECT 
        oi.id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.name as product_name,
        p.image_url,
        p.weight,
        p.metal_type
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1`,
      [orderId]
    );
    order.items = itemsResult.rows;
  } catch (err) {
    // If order_items table doesn't exist, use old schema
    if (order.product_id) {
      const productResult = await q(
        `SELECT name as product_name, image_url, weight, metal_type
         FROM products WHERE id = $1`,
        [order.product_id]
      );
      if (productResult.rows.length > 0) {
        order.items = [{
          product_id: order.product_id,
          product_name: productResult.rows[0].product_name,
          quantity: order.quantity || 1,
          unit_price: order.total_price ? (order.total_price / (order.quantity || 1)) : order.total_price,
          total_price: order.total_price,
          image_url: productResult.rows[0].image_url,
          weight: productResult.rows[0].weight,
          metal_type: productResult.rows[0].metal_type
        }];
      } else {
        order.items = [];
      }
    } else {
      order.items = [];
    }
  }

  // Get status history
  const historyResult = await q(
    `SELECT status, notes, created_at
     FROM order_status_history
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );

  order.status_history = historyResult.rows;

  // Parse shipping address
  if (order.shipping_address) {
    try {
      order.shipping_address = JSON.parse(order.shipping_address);
    } catch (e) {
      // Keep as string if not JSON
    }
  }

  return order;
}

/**
 * Get user orders with status
 */
export async function getUserOrders(userId) {
  const result = await q(
    `SELECT 
      o.id,
      o.total_price,
      o.status,
      o.payment_status,
      o.tracking_number,
      o.created_at,
      COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC`,
    [userId]
  );

  // Get first product image for each order
  for (const order of result.rows) {
    const firstItem = await q(
      `SELECT p.image_url, p.name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       LIMIT 1`,
      [order.id]
    );
    if (firstItem.rows.length > 0) {
      order.image_url = firstItem.rows[0].image_url;
      order.product_name = firstItem.rows[0].name;
    }
  }

  return result.rows;
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, status, notes = null) {
  await q(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, orderId]
  );

  // Check if order_status_history table exists before inserting
  try {
    await q(
      `INSERT INTO order_status_history (order_id, status, notes)
       VALUES ($1, $2, $3)`,
      [orderId, status, notes || `Status updated to ${status}`]
    );
  } catch (err) {
    // Table might not exist yet, log but don't fail
    console.warn('order_status_history table not found, skipping history entry');
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(orderId, paymentStatus, razorpayPaymentId = null) {
  await q(
    `UPDATE orders 
     SET payment_status = $1, 
         razorpay_payment_id = $2,
         payment_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [paymentStatus, razorpayPaymentId, orderId]
  );

  if (paymentStatus === 'paid') {
    await updateOrderStatus(orderId, 'confirmed', 'Payment received');
  } else if (paymentStatus === 'pending' && razorpayPaymentId?.startsWith('cod_')) {
    // COD orders are confirmed but payment is pending
    await updateOrderStatus(orderId, 'confirmed', 'Order placed as Cash on Delivery');
  }
}

