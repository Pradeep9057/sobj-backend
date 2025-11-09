import pool from '../db.js';

export async function list({ item_type, is_active }) {
  const clauses = [];
  const params = [];
  if (item_type) { clauses.push('item_type = ?'); params.push(item_type); }
  if (is_active !== undefined) { clauses.push('is_active = ?'); params.push(is_active); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT * FROM item_master ${where} ORDER BY created_at DESC`, params);
  return rows;
}

export async function getBySku(sku) {
  const [rows] = await pool.query('SELECT * FROM item_master WHERE sku = ?', [sku]);
  return rows[0] || null;
}

export async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM item_master WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function create(data) {
  const { sku, name, item_type, rate, description, is_active } = data;
  const [res] = await pool.query(
    'INSERT INTO item_master (sku, name, item_type, rate, description, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [sku, name, item_type || 'box', rate || 0, description || null, is_active !== undefined ? is_active : true]
  );
  return { id: res.insertId, ...data };
}

export async function update(id, data) {
  const fields = [];
  const params = [];
  for (const k of ['sku', 'name', 'item_type', 'rate', 'description', 'is_active']) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (!fields.length) return getById(id);
  params.push(id);
  await pool.query(`UPDATE item_master SET ${fields.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

export async function remove(id) {
  await pool.query('DELETE FROM item_master WHERE id = ?', [id]);
}

