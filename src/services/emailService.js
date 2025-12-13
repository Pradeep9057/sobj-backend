// import nodemailer from 'nodemailer';

// export function getTransport() {
//   const host = process.env.EMAIL_HOST;
//   const port = Number(process.env.EMAIL_PORT || 587);
//   const user = process.env.EMAIL_USER;
//   const pass = process.env.EMAIL_PASS;
//   const secure = process.env.EMAIL_SECURE === 'true';
//   return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
// }

// export async function sendOtpMail(to, code) {
//   const transporter = getTransport();
//   const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
//   const info = await transporter.sendMail({
//     from,
//     to,
//     subject: 'Your Sonaura verification code',
//     html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`
//   });
//   return info.messageId;
// }


import nodemailer from 'nodemailer';
import axios from 'axios';

let transporter = null;

/**
 * Create transporter only once (prevents re-creation + errors on Render)
 * Resets on failure to allow retry
 */
function getTransport() {
  if (transporter) return transporter;

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const missing = [];
    if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST');
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
    throw new Error(`Email configuration missing: ${missing.join(', ')} must be set in environment variables`);
  }

  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // For production environments like Render
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

/**
 * Reset transporter (useful for retry after failure)
 */
function resetTransport() {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}

/**
 * Send OTP email using Mailgun HTTP API (works on Render)
 * This bypasses SMTP port blocking by using HTTPS (port 443)
 */
async function sendViaMailgunAPI(to, code) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;

  if (!apiKey || !domain) {
    throw new Error('Mailgun API configuration missing: MAILGUN_API_KEY and MAILGUN_DOMAIN must be set');
  }

  // Extract email from "Name <email>" format if needed
  const fromEmail = from.includes('<') ? from.match(/<(.+)>/)?.[1] || from : from;

  const mailgunUrl = `https://api.mailgun.net/v3/${domain}/messages`;
  const auth = Buffer.from(`api:${apiKey}`).toString('base64');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #D4AF37;">Sonaura Verification Code</h2>
      <p>Your verification code is:</p>
      <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
        <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
      </div>
      <p>This code will expire in <b>10 minutes</b>.</p>
      <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;

  try {
    const response = await axios.post(
      mailgunUrl,
      new URLSearchParams({
        from: fromEmail,
        to: to,
        subject: 'Your Sonaura verification code',
        html: htmlContent
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      }
    );

    console.log(`✅ OTP email sent via Mailgun API to ${to} (Message ID: ${response.data.id})`);
    return response.data.id;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
    console.error(`❌ Mailgun API Error:`, {
      status: err.response?.status,
      message: errorMsg,
      data: err.response?.data
    });
    throw new Error(`Mailgun API failed: ${errorMsg}`);
  }
}

/**
 * Send OTP email using SMTP (for local development)
 */
async function sendViaSMTP(to, code) {
  const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
  let transport;
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      transport = getTransport();
      
      // Verify connection before sending (only on first attempt)
      if (retryCount === 0) {
        await transport.verify();
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #D4AF37;">Sonaura Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in <b>10 minutes</b>.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `;

      const info = await transport.sendMail({
        from,
        to,
        subject: 'Your Sonaura verification code',
        html: htmlContent,
      });

      console.log(`✅ OTP email sent via SMTP to ${to} (Message ID: ${info.messageId})`);
      return info.messageId;
    } catch (err) {
      retryCount++;
      console.error(`❌ SMTP Email Send Error (Attempt ${retryCount}/${maxRetries + 1}):`, {
        code: err.code,
        message: err.message,
        response: err.response,
        command: err.command,
        responseCode: err.responseCode
      });

      // Reset transporter on connection/auth errors to allow retry
      if (err.code === 'ECONNECTION' || err.code === 'EAUTH' || err.code === 'ETIMEDOUT') {
        resetTransport();
      }

      // If this was the last retry, throw the error
      if (retryCount > maxRetries) {
        const errorMsg = err.code 
          ? `Failed to send OTP email via SMTP after ${maxRetries + 1} attempts: ${err.code} - ${err.message}`
          : `Failed to send OTP email via SMTP after ${maxRetries + 1} attempts: ${err.message}`;
        throw new Error(errorMsg);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}

/**
 * Main function to send OTP email
 * Uses Mailgun API if configured (recommended for Render), otherwise falls back to SMTP
 */
export async function sendOtpMail(to, code) {
  // Prefer Mailgun API if configured (works on Render)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return await sendViaMailgunAPI(to, code);
  }
  
  // Fallback to SMTP (for local development)
  return await sendViaSMTP(to, code);
}
