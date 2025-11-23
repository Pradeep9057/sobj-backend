import Razorpay from 'razorpay';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt = null) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order');
  }
}

import crypto from 'crypto';

/**
 * Verify Razorpay payment
 */
export async function verifyPayment(orderId, paymentId, signature) {
  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  return generatedSignature === signature;
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay payment fetch error:', error);
    throw new Error('Failed to fetch payment details');
  }
}

