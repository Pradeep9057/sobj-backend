import pool from '../db.js';

export async function list({ category, metal, sort, min, max }) {
  const clauses = [];
  const params = [];
  if (category) { clauses.push('category = ?'); params.push(category); }
  if (metal) { clauses.push('metal_type = ?'); params.push(metal); }
  if (min) { clauses.push('price >= ?'); params.push(Number(min)); }
  if (max) { clauses.push('price <= ?'); params.push(Number(max)); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  let order = 'ORDER BY created_at DESC';
  if (sort === 'price_asc') order = 'ORDER BY price ASC';
  if (sort === 'price_desc') order = 'ORDER BY price DESC';
  const [rows] = await pool.query(`SELECT * FROM products ${where} ${order}` , params);
  
  // Fetch images for each product
  for (const product of rows) {
    const [images] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
      [product.id]
    );
    // Always ensure images array exists - use product_images if available, otherwise fallback to image_url
    product.images = images && images.length > 0
      ? images.map(img => img.image_url)
      : (product.image_url ? [product.image_url] : []);
  }
  
  return rows;
}

export async function getById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (!rows[0]) return null;
  
  // Fetch images for the product
  const [images] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
    [id]
  );
  
  // Always ensure images array exists
  rows[0].images = images && images.length > 0 
    ? images.map(img => img.image_url)
    : (rows[0].image_url ? [rows[0].image_url] : []);
  
  return rows[0];
}

export async function create(data) {
  const { sku, name, description, category, price, weight, image_url, metal_type, stock, purity, margin_percent, making_charges_type, making_charges_value, box_sku } = data;
  const [res] = await pool.query(
    'INSERT INTO products (sku, name, description, category, price, weight, image_url, metal_type, stock, purity, margin_percent, making_charges_type, making_charges_value, box_sku) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [sku || null, name, description, category, price || 0, weight || 0, image_url || '', metal_type, stock || 0, purity || null, margin_percent || 0, making_charges_type || 'fixed', making_charges_value || 0, box_sku || null]
  );
  return { id: res.insertId, ...data };
}

export async function update(id, data) {
  const fields = [];
  const params = [];
  for (const k of ['sku','name','description','category','price','weight','image_url','metal_type','stock','purity','margin_percent','making_charges_type','making_charges_value','box_sku']) {
    if (data[k] !== undefined) { fields.push(`${k} = ?`); params.push(data[k]); }
  }
  if (!fields.length) return getById(id);
  params.push(id);
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
  return getById(id);
}

export async function remove(id) {
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
}


