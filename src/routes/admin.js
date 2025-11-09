import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import * as svc from '../services/adminService.js';

const router = Router();

router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await svc.getAllOrders();
    res.json(orders);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;

