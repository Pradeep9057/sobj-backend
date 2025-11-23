import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as svc from '../services/userService.js';
import * as orderSvc from '../services/orderService.js';
import { changePassword } from '../services/passwordService.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  const data = await svc.profile(req.user.id);
  res.json(data);
});

router.get('/me/orders', requireAuth, async (req, res) => {
  const list = await svc.orders(req.user.id);
  res.json(list);
});

router.get('/me/wishlist', requireAuth, async (req, res) => {
  const list = await svc.wishlist(req.user.id);
  res.json(list);
});

router.post('/me/wishlist', requireAuth, async (req, res) => {
  const { product_id } = req.body;
  await svc.addWishlist(req.user.id, product_id);
  res.json({ ok: true });
});

router.delete('/me/wishlist/:productId', requireAuth, async (req, res) => {
  await svc.removeWishlist(req.user.id, req.params.productId);
  res.json({ ok: true });
});

export default router;

router.get('/me/addresses', requireAuth, async (req, res) => {
  const list = await svc.listAddresses(req.user.id);
  res.json(list);
});

router.post('/me/addresses', requireAuth, async (req, res) => {
  const id = await svc.upsertAddress(req.user.id, req.body);
  res.json({ id });
});

router.delete('/me/addresses/:id', requireAuth, async (req, res) => {
  await svc.deleteAddress(req.user.id, req.params.id);
  res.json({ ok: true });
});

router.post('/me/change-password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    await changePassword(req.user.id, oldPassword, newPassword);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.post('/me/orders', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    const order = await orderSvc.createOrder(req.user.id, items);
    res.status(201).json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});


