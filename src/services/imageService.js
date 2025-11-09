import pool from '../db.js';

// Product Images
export async function getProductImages(productId) {
  const [rows] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
    [productId]
  );
  return rows;
}

export async function addProductImage(productId, imageUrl, displayOrder = null) {
  // If display_order not provided, calculate it automatically
  if (displayOrder === null) {
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productId]
    );
    displayOrder = countRows[0].count;
  }
  
  // Ensure we're always inserting a new row - NEVER updating
  const [res] = await pool.query(
    'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
    [productId, imageUrl, displayOrder]
  );
  
  const insertedId = res.insertId
  console.log(`✅ INSERTED new product image:`)
  console.log(`   - ID: ${insertedId}`)
  console.log(`   - Product ID: ${productId}`)
  console.log(`   - Image URL: ${imageUrl}`)
  console.log(`   - Display Order: ${displayOrder}`)
  
  // Verify it was inserted
  const [verifyRows] = await pool.query(
    'SELECT * FROM product_images WHERE id = ?',
    [insertedId]
  );
  
  if (verifyRows.length === 0) {
    throw new Error('Failed to verify image insertion');
  }
  
  return { id: insertedId, product_id: productId, image_url: imageUrl, display_order: displayOrder };
}

export async function updateProductImage(imageId, data) {
  const fields = [];
  const params = [];
  if (data.image_url !== undefined) { fields.push('image_url = ?'); params.push(data.image_url); }
  if (data.display_order !== undefined) { fields.push('display_order = ?'); params.push(data.display_order); }
  if (!fields.length) return null;
  params.push(imageId);
  await pool.query(`UPDATE product_images SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM product_images WHERE id = ?', [imageId]);
  return rows[0] || null;
}

export async function deleteProductImage(imageId) {
  await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);
}

export async function reorderProductImages(productId, imageIds) {
  for (let i = 0; i < imageIds.length; i++) {
    await pool.query('UPDATE product_images SET display_order = ? WHERE id = ? AND product_id = ?', [i, imageIds[i], productId]);
  }
}

// Website Images
export async function getWebsiteImages(section = null) {
  let query = 'SELECT * FROM website_images WHERE is_active = TRUE';
  const params = [];
  if (section) {
    query += ' AND section = ?';
    params.push(section);
  }
  query += ' ORDER BY section, display_order ASC, id ASC';
  const [rows] = await pool.query(query, params);
  return rows;
}

export async function addWebsiteImage(section, imageUrl, title = null, description = null, displayOrder = 0) {
  const [res] = await pool.query(
    'INSERT INTO website_images (section, image_url, title, description, display_order) VALUES (?, ?, ?, ?, ?)',
    [section, imageUrl, title, description, displayOrder]
  );
  return { id: res.insertId, section, image_url: imageUrl, title, description, display_order: displayOrder };
}

export async function updateWebsiteImage(imageId, data) {
  const fields = [];
  const params = [];
  if (data.image_url !== undefined) { fields.push('image_url = ?'); params.push(data.image_url); }
  if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
  if (data.display_order !== undefined) { fields.push('display_order = ?'); params.push(data.display_order); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); params.push(data.is_active); }
  if (!fields.length) return null;
  params.push(imageId);
  await pool.query(`UPDATE website_images SET ${fields.join(', ')} WHERE id = ?`, params);
  const [rows] = await pool.query('SELECT * FROM website_images WHERE id = ?', [imageId]);
  return rows[0] || null;
}

export async function deleteWebsiteImage(imageId) {
  await pool.query('DELETE FROM website_images WHERE id = ?', [imageId]);
}

export async function reorderWebsiteImages(section, imageIds) {
  for (let i = 0; i < imageIds.length; i++) {
    await pool.query('UPDATE website_images SET display_order = ? WHERE id = ? AND section = ?', [i, imageIds[i], section]);
  }
}

