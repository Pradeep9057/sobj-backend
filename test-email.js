import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing Email Configuration...\n');
console.log('Configuration:');
console.log('  HOST:', process.env.EMAIL_HOST);
console.log('  PORT:', process.env.EMAIL_PORT);
console.log('  USER:', process.env.EMAIL_USER);
console.log('  PASSWORD:', process.env.EMAIL_PASS ? '***configured***' : 'NOT SET');
console.log('  FROM:', process.env.EMAIL_FROM);
console.log('');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
console.log('📡 Verifying connection...');
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection verification failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    process.exit(1);
  } else {
    console.log('✅ Connection verified!\n');
    sendTestEmail();
  }
});

// Send test email
async function sendTestEmail() {
  try {
    console.log('📧 Sending test email...\n');
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: 'Sonaura OTP Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #D4AF37;">Sonaura Email Test</h2>
          <p>This is a test email to verify your email configuration works correctly.</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <p><strong>Test OTP Code: 123456</strong></p>
          </div>
          <p>If you received this email, your configuration is working!</p>
        </div>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('\n📝 Check your email at:', process.env.EMAIL_USER);
    console.log('\n✅ Email configuration is working correctly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error('   Error Code:', error.code);
    console.error('   Error Message:', error.message);
    console.error('   Error Response:', error.response);
    console.error('\n🔍 Troubleshooting:');
    
    if (error.code === 'ECONNECTION') {
      console.error('   - Network connection failed');
      console.error('   - Check EMAIL_HOST and EMAIL_PORT');
      console.error('   - Ensure firewall allows SMTP connections');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   - Connection timeout');
      console.error('   - Server not responding');
      console.error('   - Check EMAIL_HOST is correct');
    } else if (error.code === 'EAUTH') {
      console.error('   - Authentication failed');
      console.error('   - Check EMAIL_USER and EMAIL_PASS');
      console.error('   - For Gmail: Use App Password (not regular password)');
      console.error('   - Get App Password from: https://myaccount.google.com/apppasswords');
    }
    
    process.exit(1);
  }
}
