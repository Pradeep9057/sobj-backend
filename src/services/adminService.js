// import pool from '../db.js';

// export async function getAllOrders() {
//   const [rows] = await pool.query(
//     `SELECT o.id, o.total_price, o.quantity, o.created_at, 
//      p.name as product_name, p.image_url,
//      u.name as user_name, u.email as user_email
//      FROM orders o 
//      JOIN products p ON p.id = o.product_id 
//      LEFT JOIN users u ON u.id = o.user_id
//      ORDER BY o.created_at DESC`
//   );
//   return rows;
// }

import pool from '../db.js';

const q = (text, params) => pool.query(text, params);

export async function getAllOrders() {
  const result = await q(
    `
    SELECT 
      o.id, 
      o.user_id,
      o.total_price, 
      o.status,
      o.payment_status,
      o.tracking_number,
      o.shipping_address,
      o.created_at,
      o.updated_at,
      u.name AS user_name,
      u.email AS user_email,
      u.phone AS user_phone,
      COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    GROUP BY o.id, u.id
    ORDER BY o.created_at DESC
    `
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

export async function getAllUsers() {
  const result = await q(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_price), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC`
  );
  return result.rows;
}

export async function getOrderDetails(orderId) {
  const result = await q(
    `SELECT 
      o.*,
      u.name AS user_name,
      u.email AS user_email,
      u.phone AS user_phone
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    WHERE o.id = $1`,
    [orderId]
  );

  if (result.rows.length === 0) return null;

  const order = result.rows[0];

  // Get order items
  const itemsResult = await q(
    `SELECT 
      oi.*,
      p.name AS product_name,
      p.image_url,
      p.weight,
      p.metal_type
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = $1`,
    [orderId]
  );

  order.items = itemsResult.rows;

  // Get status history
  const historyResult = await q(
    `SELECT * FROM order_status_history
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );

  order.status_history = historyResult.rows;

  return order;
}
