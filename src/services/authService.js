  // // import bcrypt from 'bcrypt';
  // // import jwt from 'jsonwebtoken';
  // // import pool from '../db.js';
  // // import { sendOtpMail } from './emailService.js';

  // // export async function register({ name, email, password }) {
  // //   if (!email || !password) throw new Error('Email and password required');
  // //   const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  // //   if (existing.length) throw new Error('Email already registered');
  // //   const hashed = await bcrypt.hash(password, 10);
  // //   const [result] = await pool.query(
  // //     'INSERT INTO users (name, email, password, email_verified) VALUES (?, ?, ?, 0)',
  // //     [name || '', email, hashed]
  // //   );
  // //   await sendOtp(email);
  // //   return { id: result.insertId, name, email, role: 'user', pending_verification: true };
  // // }

  // // export async function login({ email, password }) {
  // //   const [rows] = await pool.query('SELECT id, name, email, password, role FROM users WHERE email = ?', [email]);
  // //   if (!rows.length) throw new Error('Invalid credentials');
  // //   const user = rows[0];
  // //   const ok = await bcrypt.compare(password, user.password);
  // //   if (!ok) throw new Error('Invalid credentials');
  // //   await sendOtp(email);
  // //   return { otp_sent: true };
  // // }

  // // export async function profile(userId) {
  // //   const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId]);
  // //   if (!rows.length) throw new Error('User not found');
  // //   return rows[0];
  // // }

  // // export async function sendOtp(email) {
  // //   const [rows] = await pool.query('SELECT otp_code, otp_expires FROM users WHERE email = ?', [email]);
  // //   const now = Date.now();
  // //   if (rows.length && rows[0].otp_expires) {
  // //     const msLeft = new Date(rows[0].otp_expires).getTime() - now;
  // //     const minutesLeft = msLeft / 60000;
  // //     // If an OTP was set recently (more than ~9 minutes left), reuse and do not send twice
  // //     if (minutesLeft > 9) {
  // //       return true;
  // //     }
  // //   }
  // //   const code = String(Math.floor(100000 + Math.random() * 900000));
  // //   const expires = new Date(now + 10 * 60 * 1000);
  // //   await pool.query('UPDATE users SET otp_code = ?, otp_expires = ? WHERE email = ?', [code, expires, email]);
  // //   try { await sendOtpMail(email, code); } catch {}
  // //   return true;
  // // }

  // // export async function verifyOtp({ email, code }) {
  // //   const [rows] = await pool.query('SELECT id, role, otp_code, otp_expires FROM users WHERE email = ?', [email]);
  // //   if (!rows.length) throw new Error('User not found');
  // //   const user = rows[0];
  // //   if (!user.otp_code || user.otp_code !== code) throw new Error('Invalid code');
  // //   if (user.otp_expires && new Date(user.otp_expires).getTime() < Date.now()) throw new Error('Code expired');
  // //   await pool.query('UPDATE users SET email_verified = 1, otp_code = NULL, otp_expires = NULL WHERE id = ?', [user.id]);
  // //   const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2d' });
  // //   return { token };
  // // }


  // import bcrypt from 'bcrypt';
  // import jwt from 'jsonwebtoken';
  // import pool from '../db.js';
  // import { sendOtpMail } from './emailService.js';

  // // Helper to return result.rows
  // const q = (text, params) => pool.query(text, params);

  // export async function register({ name, email, password }) {
  //   if (!email || !password) throw new Error('Email and password required');

  //   // Check existing user
  //   const existing = await q(
  //     'SELECT id FROM users WHERE email = $1',
  //     [email]
  //   );

  //   if (existing.rows.length) throw new Error('Email already registered');

  //   const hashed = await bcrypt.hash(password, 10);

  //   // Insert user
  //   const result = await q(
  //     `INSERT INTO users (name, email, password, email_verified)
  //     VALUES ($1, $2, $3, 0)
  //     RETURNING id`,
  //     [name || '', email, hashed]
  //   );

  //   await sendOtp(email);

  //   return {
  //     id: result.rows[0].id,
  //     name,
  //     email,
  //     role: 'user',
  //     pending_verification: true
  //   };
  // }

  // export async function login({ email, password }) {
  //   const result = await q(
  //     `SELECT id, name, email, password, role 
  //     FROM users 
  //     WHERE email = $1`,
  //     [email]
  //   );

  //   if (result.rows.length === 0) throw new Error('Invalid credentials');

  //   const user = result.rows[0];

  //   const ok = await bcrypt.compare(password, user.password);
  //   if (!ok) throw new Error('Invalid credentials');

  //   await sendOtp(email);

  //   return { otp_sent: true };
  // }

  // export async function profile(userId) {
  //   const result = await q(
  //     `SELECT id, name, email, role, created_at 
  //     FROM users 
  //     WHERE id = $1`,
  //     [userId]
  //   );

  //   if (result.rows.length === 0) throw new Error('User not found');

  //   return result.rows[0];
  // }

  // export async function sendOtp(email) {
  //   const result = await q(
  //     `SELECT otp_code, otp_expires 
  //     FROM users 
  //     WHERE email = $1`,
  //     [email]
  //   );

  //   const row = result.rows[0];
  //   const now = Date.now();

  //   if (row && row.otp_expires) {
  //     const msLeft = new Date(row.otp_expires).getTime() - now;
  //     const minutesLeft = msLeft / 60000;

  //     // Prevent multiple OTPs within 1 minute
  //     if (minutesLeft > 9) return true;
  //   }

  //   const code = String(Math.floor(100000 + Math.random() * 900000));
  //   const expires = new Date(now + 10 * 60 * 1000);

  //   await q(
  //     `UPDATE users 
  //     SET otp_code = $1, otp_expires = $2 
  //     WHERE email = $3`,
  //     [code, expires, email]
  //   );

  //   try {
  //     await sendOtpMail(email, code);
  //   } catch {}

  //   return true;
  // }

  // export async function verifyOtp({ email, code }) {
  //   const result = await q(
  //     `SELECT id, role, otp_code, otp_expires 
  //     FROM users 
  //     WHERE email = $1`,
  //     [email]
  //   );

  //   if (result.rows.length === 0) throw new Error('User not found');

  //   const user = result.rows[0];

  //   if (!user.otp_code || user.otp_code !== code) {
  //     throw new Error('Invalid code');
  //   }

  //   if (user.otp_expires && new Date(user.otp_expires).getTime() < Date.now()) {
  //     throw new Error('Code expired');
  //   }

  //   await q(
  //     `UPDATE users 
  //     SET email_verified = 1, otp_code = NULL, otp_expires = NULL 
  //     WHERE id = $1`,
  //     [user.id]
  //   );

  //   const token = jwt.sign(
  //     { id: user.id, role: user.role },
  //     process.env.JWT_SECRET,
  //     { expiresIn: '2d' }
  //   );

  //   return { token };
  // }
export async function login({ email, password }) {
  const result = await q(
    `SELECT id, name, email, password, role 
     FROM users 
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) throw new Error('Invalid credentials');

  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error('Invalid credentials');

  // Direct login — no OTP
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2d' }
  );

  return { token };
}
