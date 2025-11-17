import { Router } from 'express';
import { register, login, profile } from '../services/authService.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

/**
 * REGISTER (no OTP needed)
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
 * LOGIN (Direct login, no OTP)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await login({ email, password });

    // Set token instantly after password valid
    res.cookie('token', r.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 2 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(401).json({ message: e.message });
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
