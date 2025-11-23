import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';
import * as svc from '../services/adminService.js';
import * as orderSvc from '../services/orderService.js';
import pool from '../db.js';

const router = Router();

router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const orders = await svc.getAllOrders();
    res.json(orders);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.get('/orders/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const order = await svc.getOrderDetails(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put('/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, notes, tracking_number } = req.body;
    
    // Update order status
    await orderSvc.updateOrderStatus(req.params.id, status, notes);
    
    // Update tracking number if provided
    if (tracking_number) {
      await pool.query(
        `UPDATE orders SET tracking_number = $1, updated_at = NOW() WHERE id = $2`,
        [tracking_number, req.params.id]
      );
    }
    
    res.json({ ok: true, message: 'Order updated successfully' });
  } catch (e) {
    console.error('Order update error:', e);
    res.status(400).json({ message: e.message || 'Failed to update order' });
  }
});

router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await svc.getAllUsers();
    res.json(users);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;

