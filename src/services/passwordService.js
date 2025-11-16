// import pool from '../db.js';
// import bcrypt from 'bcrypt';

// export async function changePassword(userId, oldPassword, newPassword) {
//   if (!newPassword || newPassword.length < 6) throw new Error('Password too short');
//   const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
//   if (!rows.length) throw new Error('User not found');
//   const ok = await bcrypt.compare(oldPassword, rows[0].password);
//   if (!ok) throw new Error('Incorrect current password');
//   const hashed = await bcrypt.hash(newPassword, 10);
//   await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
// }


import pool from '../db.js';
import bcrypt from 'bcrypt';

// Helper for shorter queries
const q = (sql, params) => pool.query(sql, params);

export async function changePassword(userId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password too short');
  }

  // 1. Fetch user
  const result = await q(
    `SELECT password 
     FROM users 
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  // 2. Compare old password
  const ok = await bcrypt.compare(oldPassword, result.rows[0].password);
  if (!ok) throw new Error('Incorrect current password');

  // 3. Hash new password
  const hashed = await bcrypt.hash(newPassword, 10);

  // 4. Update password
  await q(
    `UPDATE users 
     SET password = $1 
     WHERE id = $2`,
    [hashed, userId]
  );

  return true;
}
