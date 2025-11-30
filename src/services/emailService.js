import nodemailer from 'nodemailer';

let transporter = null;

function getTransport() {
  // Validate email configuration
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  // Create transporter only once (prevents re-creation + errors on Render)
  if (!transporter) {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const secure = process.env.EMAIL_SECURE === 'true';
    
    transporter = nodemailer.createTransport({ 
      host, 
      port, 
      secure, 
      auth: { user, pass },
      // Add timeout and connection options
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }
  
  return transporter;
}

export async function sendOtpMail(to, code) {
  const transporter = getTransport();
  
  // If email is not configured, log OTP to console instead
  if (!transporter) {
    console.log(`\n📧 ============================================`);
    console.log(`📧 OTP for ${to}: ${code}`);
    console.log(`📧 Email service not configured. OTP logged above.`);
    console.log(`📧 ============================================\n`);
    // Return success so registration/login can continue
    return 'console-logged';
  }

  try {
    const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
    
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Your Sonaura verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Sonaura Verification Code</h2>
          <p>Your verification code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #D4AF37; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in <b>10 minutes</b>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `
    });
    console.log(`✅ OTP email sent to ${to}: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error(`⚠️ OTP Email Send Error for ${to}:`, err.message);
    // Log OTP to console as fallback
    console.log(`\n📧 ============================================`);
    console.log(`📧 OTP for ${to}: ${code}`);
    console.log(`📧 Email sending failed. OTP logged above.`);
    console.log(`📧 ============================================\n`);
    // Return success so registration/login can continue
    return 'console-logged-fallback';
  }
}