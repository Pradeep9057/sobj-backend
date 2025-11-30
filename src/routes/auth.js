import { Router } from 'express';
import { register, login, profile, sendOtp, verifyOtp } from '../services/authService.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await register({ name, email, password });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await login({ email, password });
    res.json(r);
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const data = await profile(req.user.id);
    res.json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    await sendOtp(email);
    res.json({ otp_sent: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  try {
    const { token } = await verifyOtp({ email, code });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 2 * 24 * 60 * 60 * 1000 });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/logout', async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false });
  res.json({ ok: true });
});


