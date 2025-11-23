import Razorpay from 'razorpay';

// Initialize Razorpay only if credentials are available
let razorpay = null;

function getRazorpayInstance() {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt = null) {
  const razorpayInstance = getRazorpayInstance();
  
  if (!razorpayInstance) {
    throw new Error('Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.');
  }

  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    };
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw new Error('Failed to create payment order: ' + error.message);
  }
}

import crypto from 'crypto';

/**
 * Verify Razorpay payment
 */
export async function verifyPayment(orderId, paymentId, signature) {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret not configured');
  }
  
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
  const razorpayInstance = getRazorpayInstance();
  
  if (!razorpayInstance) {
    throw new Error('Razorpay credentials not configured');
  }
  
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Razorpay payment fetch error:', error);
    throw new Error('Failed to fetch payment details');
  }
}

