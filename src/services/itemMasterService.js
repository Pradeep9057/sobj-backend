// import pool from '../db.js';

// export async function list({ item_type, is_active }) {
//   const clauses = [];
//   const params = [];
//   if (item_type) { clauses.push('item_type = ?'); params.push(item_type); }
//   if (is_active !== undefined) { clauses.push('is_active = ?'); params.push(is_active); }
//   const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
//   const [rows] = await pool.query(`SELECT * FROM item_master ${where} ORDER BY created_at DESC`, params);
//   return rows;
// }

// export async function getBySku(sku) {
//   const [rows] = await pool.query('SELECT * FROM item_master WHERE sku = ?', [sku]);
//   return rows[0] || null;
// }

// export async function getById(id) {
//   const [rows] = await pool.query('SELECT * FROM item_master WHERE id = ?', [id]);
//   return rows[0] || null;
// }

// export async function create(data) {
//   const { sku, name, item_type, rate, description, is_active } = data;
//   const [res] = await pool.query(
//     'INSERT INTO item_master (sku, name, item_type, rate, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
//     [sku, name, item_type || 'box', rate || 0, description || null, is_active !== undefined ? is_active : true]
//   );
//   return { id: res.insertId, ...data };
// }

// export async function update(id, data) {
//   const fields = [];
//   const params = [];
//   for (const k of ['sku', 'name', 'item_type', 'rate', 'description', 'is_active']) {
//     if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
//   }
//   if (!fields.length) return getById(id);
//   params.push(id);
//   await pool.query(`UPDATE item_master SET ${fields.join(', ')} WHERE id = ?`, params);
//   return getById(id);
// }

// export async function remove(id) {
//   await pool.query('DELETE FROM item_master WHERE id = ?', [id]);
// }

import pool from '../db.js';

// Helper for cleaner PostgreSQL queries
const q = (sql, params) => pool.query(sql, params);

// ==========================================
// LIST ITEMS
// ==========================================

export async function list({ item_type, is_active }) {
  const clauses = [];
  const params = [];
  let idx = 1;

  if (item_type) {
    clauses.push(`item_type = $${idx++}`);
    params.push(item_type);
  }

  if (is_active !== undefined) {
    clauses.push(`is_active = $${idx++}`);
    params.push(is_active);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const result = await q(
    `SELECT * FROM item_master 
     ${where} 
     ORDER BY created_at DESC`,
    params
  );

  return result.rows;
}

// ==========================================
// GET BY SKU
// ==========================================

export async function getBySku(sku) {
  const result = await q(
    `SELECT * FROM item_master WHERE sku = $1`,
    [sku]
  );
  return result.rows[0] || null;
}

// ==========================================
// GET BY ID
// ==========================================

export async function getById(id) {
  const result = await q(
    `SELECT * FROM item_master WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

// ==========================================
// CREATE ITEM
// ==========================================

export async function create(data) {
  const { sku, name, item_type, rate, description, is_active } = data;

  const result = await q(
    `INSERT INTO item_master 
     (sku, name, item_type, rate, description, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      sku,
      name,
      item_type || 'box',
      rate || 0,
      description || null,
      is_active !== undefined ? is_active : true
    ]
  );

  return { id: result.rows[0].id, ...data };
}

// ==========================================
// UPDATE ITEM
// ==========================================

export async function update(id, data) {
  const fields = [];
  const params = [];
  let idx = 1;

  for (const k of ['sku', 'name', 'item_type', 'rate', 'description', 'is_active']) {
    if (data[k] !== undefined) {
      fields.push(`${k} = $${idx++}`);
      params.push(data[k]);
    }
  }

  if (!fields.length) return getById(id);

  params.push(id);

  await q(
    `UPDATE item_master 
     SET ${fields.join(', ')} 
     WHERE id = $${idx}`,
    params
  );

  return getById(id);
}

// ==========================================
// DELETE ITEM
// ==========================================

export async function remove(id) {
  await q(
    `DELETE FROM item_master WHERE id = $1`,
    [id]
  );
}
