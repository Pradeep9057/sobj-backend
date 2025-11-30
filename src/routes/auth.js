import { Router } from 'express';
import { register, login, profile, verifyOtp } from '../services/authService.js';
import { requireAuth } from '../middlewares/auth.js';
import { sendOtpMail } from '../services/emailService.js';

const router = Router();

/**
 * REGISTER (sends OTP)
 */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  
  try {
    const user = await register({ name, email, password });
    res.status(201).json(user);
  } catch (e) {
    console.error('Registration error:', e.message);
    res.status(400).json({ message: e.message });
  }
});

/**
 * LOGIN (sends OTP)
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  try {
    const r = await login({ email, password });
    res.json(r);
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(401).json({ message: e.message });
  }
});

/**
 * VERIFY OTP (returns token)
 */
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  
  // Validate input
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }
  
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
    console.error('OTP verification error:', e.message);
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

/**
 * TEST EMAIL SENDING
 */
router.post('/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    const info = await sendOtpMail(email, '123456');
    res.json({ message: 'Test OTP email sent', info });
  } catch (e) {
    res.status(500).json({ message: 'Failed to send test email', error: e.message });
  }
});

export default router;
