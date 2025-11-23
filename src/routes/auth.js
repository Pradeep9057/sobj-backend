import { Router } from 'express';
import { register, login, profile, verifyOtp } from '../services/authService.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * REGISTER (sends OTP)
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await register({ name, email, password });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * LOGIN (sends OTP)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await login({ email, password });
    res.json(r);
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

/**
 * VERIFY OTP (returns token)
 */
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  try {
    const result = await verifyOtp({ email, code });
    
    // Set token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    // Also return token in response for frontend to store
    res.json({ token: result.token, ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * PROFILE
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const data = await profile(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * LOGOUT
 */
router.post('/logout', async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false });
  res.json({ ok: true });
});

export default router;
