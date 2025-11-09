import pool from '../db.js';
import bcrypt from 'bcrypt';

export async function changePassword(userId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error('Password too short');
  const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
  if (!rows.length) throw new Error('User not found');
  const ok = await bcrypt.compare(oldPassword, rows[0].password);
  if (!ok) throw new Error('Incorrect current password');
  const hashed = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);
}


