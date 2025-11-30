import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as orderSvc from '../services/orderService.js';
import pool from '../db.js';

const router = Router();

const q = (text, params) => pool.query(text, params);

/**
 * Middleware to handle auth from URL token parameter
 */
async function handleInvoiceAuth(req, res, next) {
  // Check for token in query parameter first (for invoice viewing)
  const tokenParam = req.query.token;
  if (tokenParam) {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(tokenParam, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      // Token invalid, try standard auth
    }
  }
  
  // Fall back to standard auth
  return requireAuth(req, res, next);
}

/**
 * Generate invoice for order
 */
router.get('/:orderId', handleInvoiceAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    // Get order details
    const order = await orderSvc.getOrderById(orderId, isAdmin ? null : userId);

    if (!order) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Order Not Found</h1>
            <p>Order #${orderId} could not be found.</p>
          </body>
        </html>
      `);
    }

    if (!isAdmin && order.user_id !== userId) {
      return res.status(403).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>Access Denied</h1>
            <p>You don't have permission to view this invoice.</p>
          </body>
        </html>
      `);
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHTML(order);

    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHtml);
  } catch (e) {
    console.error('Invoice error:', e);
    res.status(400).send(`
      <html>
        <body style="font-family: Arial; padding: 40px; text-align: center;">
          <h1>Error</h1>
          <p>${e.message}</p>
        </body>
      </html>
    `);
  }
});

/**
 * Download invoice as PDF (placeholder - can integrate with PDF library)
 */
router.get('/:orderId/pdf', handleInvoiceAuth, async (req, res) => {
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
  let shippingAddr = {};
  try {
    shippingAddr = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : (order.shipping_address || {});
  } catch (e) {
    shippingAddr = {};
  }

  // Handle both new schema (order_items) and old schema (direct product_id)
  let items = order.items || [];
  if (items.length === 0 && order.product_id) {
    // Old schema - create item from order
    items = [{
      product_name: order.product_name || 'Product',
      quantity: order.quantity || 1,
      unit_price: order.total_price ? (order.total_price / (order.quantity || 1)) : order.total_price,
      total_price: order.total_price
    }];
  }

  const orderDate = new Date(order.created_at);
  const invoiceNumber = `INV-${String(order.id).padStart(6, '0')}`;
  const paymentStatus = order.payment_status || 'pending';
  const orderStatus = order.status || 'pending';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - Sonaura</title>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { margin: 0; padding: 20px; }
      .print-break { page-break-after: always; }
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      padding: 20px;
      color: #333;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
      color: #000;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    
    .invoice-header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 300px;
      height: 300px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }
    
    .invoice-header h1 {
      font-size: 42px;
      font-weight: 700;
      margin-bottom: 8px;
      position: relative;
      z-index: 1;
    }
    
    .invoice-header p {
      font-size: 16px;
      opacity: 0.9;
      position: relative;
      z-index: 1;
    }
    
    .invoice-body {
      padding: 40px;
    }
    
    .invoice-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .info-section h3 {
      color: #D4AF37;
      font-size: 18px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    
    .info-section p {
      margin: 8px 0;
      color: #555;
      font-size: 14px;
    }
    
    .info-section strong {
      color: #333;
      font-weight: 600;
      display: inline-block;
      min-width: 120px;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 5px;
    }
    
    .status-paid {
      background: #4CAF50;
      color: white;
    }
    
    .status-pending {
      background: #ff9800;
      color: white;
    }
    
    .status-confirmed {
      background: #2196F3;
      color: white;
    }
    
    .status-shipped {
      background: #9C27B0;
      color: white;
    }
    
    .status-delivered {
      background: #4CAF50;
      color: white;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
      background: white;
    }
    
    .items-table thead {
      background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
      color: #000;
    }
    
    .items-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .items-table td {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      color: #555;
    }
    
    .items-table tbody tr:hover {
      background: #fafafa;
    }
    
    .items-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    .total-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #D4AF37;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      font-size: 16px;
    }
    
    .total-row.grand-total {
      font-size: 24px;
      font-weight: 700;
      color: #D4AF37;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      margin-top: 10px;
    }
    
    .footer {
      background: #f8f8f8;
      padding: 30px 40px;
      text-align: center;
      border-top: 2px solid #f0f0f0;
    }
    
    .footer p {
      color: #666;
      margin: 8px 0;
      font-size: 14px;
    }
    
    .print-actions {
      text-align: center;
      margin: 20px 0;
      padding: 20px;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 30px;
      background: #D4AF37;
      color: #000;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 0 10px;
      cursor: pointer;
      border: none;
      font-size: 14px;
      transition: all 0.3s;
    }
    
    .btn:hover {
      background: #B8941F;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }
    
    .invoice-number {
      font-size: 28px;
      font-weight: 700;
      color: #000;
      margin-bottom: 10px;
    }
    
    @media (max-width: 768px) {
      .invoice-info {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .invoice-header {
        padding: 30px 20px;
      }
      
      .invoice-body {
        padding: 20px;
      }
      
      .items-table {
        font-size: 12px;
      }
      
      .items-table th,
      .items-table td {
        padding: 10px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <h1>SONAURA</h1>
      <p>Premium Jewellery by Shree Om Banna Jewellers</p>
    </div>
    
    <div class="invoice-body">
      <div class="invoice-info">
        <div class="info-section">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Number:</strong> <span class="invoice-number">${invoiceNumber}</span></p>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Invoice Date:</strong> ${orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Order Date:</strong> ${orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Order Status:</strong> 
            <span class="status-badge status-${orderStatus}">${orderStatus}</span>
          </p>
          <p><strong>Payment Status:</strong> 
            <span class="status-badge status-${paymentStatus}">${paymentStatus}</span>
          </p>
          ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
          ${order.razorpay_payment_id && !order.razorpay_payment_id.startsWith('cod_') ? `<p><strong>Payment ID:</strong> ${order.razorpay_payment_id}</p>` : ''}
        </div>
        
        <div class="info-section">
          <h3>Shipping Address</h3>
          <p><strong>Name:</strong> ${shippingAddr?.full_name || order.user_name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${shippingAddr?.phone || 'N/A'}</p>
          <p><strong>Address:</strong></p>
          <p style="margin-left: 20px; margin-top: 5px;">
            ${shippingAddr?.line1 || ''}${shippingAddr?.line2 ? ', ' + shippingAddr.line2 : ''}<br>
            ${shippingAddr?.city || ''}, ${shippingAddr?.state || ''} ${shippingAddr?.postal_code || ''}<br>
            ${shippingAddr?.country || 'India'}
          </p>
        </div>
      </div>
      
      <h3 style="color: #D4AF37; margin-bottom: 20px; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th style="text-align: right;">Unit Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${item.product_name || 'Product'}</strong></td>
              <td>${item.quantity || 1}</td>
              <td style="text-align: right;">₹${Number(item.unit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td style="text-align: right;"><strong>₹${Number(item.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>₹${Number(order.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div class="total-row grand-total">
          <span>Grand Total:</span>
          <span>₹${Number(order.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      
      <div style="margin-top: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px; border-left: 4px solid #D4AF37;">
        <p style="color: #666; font-size: 14px; line-height: 1.8;">
          <strong style="color: #333;">Payment Method:</strong> ${paymentStatus === 'paid' ? 'Online Payment' : paymentStatus === 'pending' && order.razorpay_payment_id?.startsWith('cod_') ? 'Cash on Delivery (COD)' : 'Pending Payment'}<br>
          <strong style="color: #333;">Terms:</strong> All items are subject to availability. Prices are inclusive of GST.<br>
          <strong style="color: #333;">Note:</strong> Please keep this invoice for your records.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Thank you for your purchase!</strong></p>
      <p>For any queries or support, please contact us:</p>
      <p>Email: support@sonaura.in | Phone: +91-XXXXXXXXXX</p>
      <p style="margin-top: 15px; font-size: 12px; color: #999;">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  </div>
  
  <div class="print-actions no-print">
    <button class="btn" onclick="window.print()">🖨️ Print Invoice</button>
    <button class="btn" onclick="window.close()">✕ Close</button>
  </div>
  
  <script>
    // Auto-print on load if print parameter is present
    if (window.location.search.includes('print=true')) {
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      };
    }
  </script>
</body>
</html>
  `;
}

export default router;

