import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as paymentSvc from '../services/paymentService.js';
import * as orderSvc from '../services/orderService.js';

const router = Router();

/**
 * Create Razorpay order
 */
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    const order = await paymentSvc.createRazorpayOrder(amount, 'INR', receipt);
    res.json(order);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * Verify payment and update order
 */
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { order_id, payment_id, signature, orderId } = req.body;

    // Verify payment signature
    const isValid = await paymentSvc.verifyPayment(order_id, payment_id, signature);

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Update order payment status
    await orderSvc.updatePaymentStatus(orderId, 'paid', payment_id);

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

export default router;

