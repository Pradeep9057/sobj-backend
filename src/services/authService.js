import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

// Helper for Postgres queries
const q = (text, params) => pool.query(text, params);

/**
 * REGISTER USER — No OTP
 */
export async function register({ name, email, password }) {
  if (!email || !password) throw new Error('Email and password required');

  // Check if user exists
  const existing = await q(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 10);

  // Insert new user (email_verified = true because OTP removed)
  const result = await q(
    `INSERT INTO users (name, email, password, email_verified)
     VALUES ($1, $2, $3, true)
     RETURNING id, name, email, role`,
    [name || '', email, hashed]
  );

  const user = result.rows[0];

  // Generate token immediately
  const token = jwt.sign(
    { id: user.id, role: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '2d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'user'
    }
  };
}

/**
 * LOGIN USER — No OTP, direct login
 */
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

  // Direct login — generate token immediately
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

/**
 * USER PROFILE
 */
export async function profile(userId) {
  const result = await q(
    `SELECT id, name, email, role, created_at 
     FROM users 
     WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) throw new Error('User not found');

  return result.rows[0];
}
