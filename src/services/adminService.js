import pool from '../db.js';

export async function getAllOrders() {
  const [rows] = await pool.query(
    `SELECT o.id, o.total_price, o.quantity, o.created_at, 
     p.name as product_name, p.image_url,
     u.name as user_name, u.email as user_email
     FROM orders o 
     JOIN products p ON p.id = o.product_id 
     LEFT JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return rows;
}

