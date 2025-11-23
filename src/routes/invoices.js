import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as orderSvc from '../services/orderService.js';
import pool from '../db.js';

const router = Router();

const q = (text, params) => pool.query(text, params);

/**
 * Generate invoice for order
 */
router.get('/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get order details
    const order = await orderSvc.getOrderById(orderId, isAdmin ? null : userId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHTML(order);

    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHtml);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

/**
 * Download invoice as PDF (placeholder - can integrate with PDF library)
 */
router.get('/:orderId/pdf', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const order = await orderSvc.getOrderById(orderId, isAdmin ? null : userId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For now, return HTML that can be printed as PDF
    // In production, use a library like puppeteer or pdfkit
    const invoiceHtml = generateInvoiceHTML(order);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${orderId}.html"`);
    res.send(invoiceHtml);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

function generateInvoiceHTML(order) {
  const shippingAddr = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    .header { border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #D4AF37; margin: 0; }
    .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-section { flex: 1; }
    .info-section h3 { margin-top: 0; color: #D4AF37; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #D4AF37; color: #000; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.1em; }
    .total { text-align: right; margin-top: 20px; }
    .status { display: inline-block; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
    .status.paid { background: #4CAF50; color: white; }
    .status.pending { background: #ff9800; color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Sonaura</h1>
    <p>Premium Jewellery by Shree Om Banna Jewellers</p>
  </div>
  
  <div class="info">
    <div class="info-section">
      <h3>Invoice Details</h3>
      <p><strong>Invoice #:</strong> ${order.id}</p>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
      <p><strong>Status:</strong> <span class="status ${order.payment_status}">${order.payment_status || 'Pending'}</span></p>
      ${order.tracking_number ? `<p><strong>Tracking:</strong> ${order.tracking_number}</p>` : ''}
    </div>
    <div class="info-section">
      <h3>Shipping Address</h3>
      <p>${shippingAddr?.full_name || ''}</p>
      <p>${shippingAddr?.line1 || ''}${shippingAddr?.line2 ? ', ' + shippingAddr.line2 : ''}</p>
      <p>${shippingAddr?.city || ''}, ${shippingAddr?.state || ''} ${shippingAddr?.postal_code || ''}</p>
      <p>${shippingAddr?.country || ''}</p>
      <p>Phone: ${shippingAddr?.phone || ''}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${(order.items || []).map(item => `
        <tr>
          <td>${item.product_name || 'Product'}</td>
          <td>${item.quantity}</td>
          <td>₹${Number(item.unit_price).toFixed(2)}</td>
          <td>₹${Number(item.total_price).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">Total:</td>
        <td>₹${Number(order.total_price).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
    <p>Thank you for your purchase!</p>
    <p>For any queries, please contact us at support@sonaura.in</p>
  </div>
</body>
</html>
  `;
}

export default router;

