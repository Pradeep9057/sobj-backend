import nodemailer from 'nodemailer';

let transporter = null;
let emailProvider = 'unknown';

function getTransport() {
  // Validate email configuration
  const missingVars = [];
  if (!process.env.EMAIL_HOST) missingVars.push('EMAIL_HOST');
  if (!process.env.EMAIL_USER) missingVars.push('EMAIL_USER');
  if (!process.env.EMAIL_PASS) missingVars.push('EMAIL_PASS');

  if (missingVars.length > 0) {
    console.error(`⚠️ Email configuration missing environment variables: ${missingVars.join(', ')}`);
    return null;
  }

  // Create transporter only once (prevents re-creation + errors on Render)
  if (!transporter) {
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const secure = process.env.EMAIL_SECURE === 'true';

    // Determine email provider
    if (host.includes('mailgun')) emailProvider = 'Mailgun';
    else if (host.includes('sendgrid')) emailProvider = 'SendGrid';
    else if (host.includes('gmail')) emailProvider = 'Gmail';
    else emailProvider = 'Custom SMTP';

    console.log(`\n📧 ========== EMAIL SERVICE CONFIGURATION ==========`);
    console.log(`📧 Provider: ${emailProvider}`);
    console.log(`📧 HOST: ${host}`);
    console.log(`📧 PORT: ${port}`);
    console.log(`📧 SECURE: ${secure}`);
    console.log(`📧 USER: ${user.substring(0, 5)}...`);
    console.log(`📧 FROM: ${process.env.EMAIL_FROM || 'default'}`);
    console.log(`📧 ====================================================\n`);

    try {
      transporter = nodemailer.createTransport({ 
        host, 
        port, 
        secure, 
        auth: { user, pass },
        // Increase timeouts significantly
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000,
        // Additional options for better reliability
        tls: {
          rejectUnauthorized: false
        },
        pool: {
          maxConnections: 1,
          maxMessages: Infinity,
          rateDelta: 10000,
          rateLimit: 5
        }
      });

      // Verify connection on startup
      transporter.verify((error, success) => {
        if (error) {
          console.error(`❌ ${emailProvider} connection failed:`, error.message);
          console.error('   Error Code:', error.code);
        } else {
          console.log(`✅ ${emailProvider} is ready to send emails!`);
        }
      });
    } catch (e) {
      console.error('⚠️ Error creating email transporter:', e.message);
      transporter = null;
    }
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
    return 'console-logged';
  }

  try {
    const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
    
    console.log(`📧 Attempting to send OTP email to: ${to}`);
    
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Your Sonaura verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #D4AF37; text-align: center; margin-bottom: 30px;">Sonaura Verification Code</h2>
          <p style="color: #333; font-size: 16px;">Your verification code is:</p>
          <div style="background: white; padding: 30px; text-align: center; font-size: 48px; font-weight: bold; color: #D4AF37; letter-spacing: 8px; margin: 30px 0; border: 2px solid #D4AF37; border-radius: 8px;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">This code will expire in <b>10 minutes</b>.</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 11px; text-align: center;">© 2024 Sonaura. All rights reserved.</p>
        </div>
      `
    });
    console.log(`✅ OTP email sent successfully to ${to}: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error(`⚠️ OTP Email Send Error for ${to}:`);
    console.error(`   Error Code: ${err.code}`);
    console.error(`   Error Message: ${err.message}`);
    console.error(`   Error Response: ${err.response}`);
    
    // Log OTP to console as fallback
    console.log(`\n📧 ============================================`);
    console.log(`📧 OTP for ${to}: ${code}`);
    console.log(`📧 Email sending failed. OTP logged above.`);
    console.log(`📧 ============================================\n`);
    
    // Return success so registration/login can continue
    return 'console-logged-fallback';
  }
}