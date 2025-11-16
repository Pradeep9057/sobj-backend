// import pool from '../db.js';

// export async function profile(userId) {
//   const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
//   return rows[0] || null;
// }

// export async function orders(userId) {
//   const [rows] = await pool.query(
//     'SELECT o.id, o.total_price, o.quantity, o.created_at, p.name, p.image_url FROM orders o JOIN products p ON p.id = o.product_id WHERE o.user_id = ? ORDER BY o.created_at DESC',
//     [userId]
//   );
//   return rows;
// }

// export async function wishlist(userId) {
//   const [rows] = await pool.query(
//     'SELECT w.product_id, w.created_at, p.name, p.image_url, p.weight, p.metal_type FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ? ORDER BY w.created_at DESC',
//     [userId]
//   );
//   return rows;
// }

// export async function addWishlist(userId, productId) {
//   await pool.query('INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)', [userId, productId]);
// }

// export async function removeWishlist(userId, productId) {
//   await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
// }

// export async function listAddresses(userId) {
//   const [rows] = await pool.query(
//     'SELECT id, full_name, phone, line1, line2, city, state, postal_code, country, is_default FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
//     [userId]
//   );
//   return rows;
// }

// export async function upsertAddress(userId, addr) {
//   if (addr.is_default) {
//     await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
//   }
//   if (addr.id) {
//     await pool.query(
//       'UPDATE addresses SET full_name=?, phone=?, line1=?, line2=?, city=?, state=?, postal_code=?, country=?, is_default=? WHERE id=? AND user_id=?',
//       [addr.full_name, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country, addr.is_default ? 1 : 0, addr.id, userId]
//     );
//     return addr.id;
//   }
//   const [res] = await pool.query(
//     'INSERT INTO addresses (user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default) VALUES (?,?,?,?,?,?,?,?,?,?)',
//     [userId, addr.full_name, addr.phone, addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country, addr.is_default ? 1 : 0]
//   );
//   return res.insertId;
// }

// export async function deleteAddress(userId, id) {
//   await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
// }


import pool from '../db.js';

// helper for cleaner PostgreSQL queries
const q = (sql, params) => pool.query(sql, params);

// ================================================================
// USER PROFILE
// ================================================================
export async function profile(userId) {
  const result = await q(
    `SELECT id, name, email, role, created_at 
     FROM users 
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// ================================================================
// USER ORDERS
// ================================================================
export async function orders(userId) {
  const result = await q(
    `SELECT 
        o.id, 
        o.total_price, 
        o.quantity, 
        o.created_at, 
        p.name, 
        p.image_url
     FROM orders o
     JOIN products p ON p.id = o.product_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ================================================================
// USER WISHLIST
// ================================================================
export async function wishlist(userId) {
  const result = await q(
    `SELECT 
        w.product_id, 
        w.created_at, 
        p.name, 
        p.image_url, 
        p.weight, 
        p.metal_type
     FROM wishlist w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = $1
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return result.rows;
}

// PostgreSQL does NOT support INSERT IGNORE
// Use ON CONFLICT instead (must have unique constraint on (user_id, product_id))
export async function addWishlist(userId, productId) {
  await q(
    `INSERT INTO wishlist (user_id, product_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, product_id) DO NOTHING`,
    [userId, productId]
  );
}

export async function removeWishlist(userId, productId) {
  await q(
    `DELETE FROM wishlist 
     WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
}

// ================================================================
// USER ADDRESSES
// ================================================================
export async function listAddresses(userId) {
  const result = await q(
    `SELECT 
        id, full_name, phone, line1, line2, city, state, 
        postal_code, country, is_default
     FROM addresses
     WHERE user_id = $1
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return result.rows;
}

// PostgreSQL UPSERT for addresses
export async function upsertAddress(userId, addr) {
  // If new default address is being set → remove default from others
  if (addr.is_default) {
    await q(
      `UPDATE addresses 
       SET is_default = FALSE
       WHERE user_id = $1`,
      [userId]
    );
  }

  // Update existing address
  if (addr.id) {
    await q(
      `UPDATE addresses 
       SET full_name=$1, phone=$2, line1=$3, line2=$4, city=$5, state=$6, 
           postal_code=$7, country=$8, is_default=$9
       WHERE id=$10 AND user_id=$11`,
      [
        addr.full_name,
        addr.phone,
        addr.line1,
        addr.line2,
        addr.city,
        addr.state,
        addr.postal_code,
        addr.country,
        addr.is_default ? true : false,
        addr.id,
        userId
      ]
    );
    return addr.id;
  }

  // Insert new address
  const result = await q(
    `INSERT INTO addresses 
       (user_id, full_name, phone, line1, line2, city, state, postal_code, country, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id`,
    [
      userId,
      addr.full_name,
      addr.phone,
      addr.line1,
      addr.line2,
      addr.city,
      addr.state,
      addr.postal_code,
      addr.country,
      addr.is_default ? true : false
    ]
  );

  return result.rows[0].id;
}

export async function deleteAddress(userId, id) {
  await q(
    `DELETE FROM addresses 
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}
