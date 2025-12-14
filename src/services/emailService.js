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

let transporters = new Map();

/**
 * Create SMTP transporter with specific configuration
 * Tries multiple ports and configurations to bypass Render's SMTP blocking
 */
function createTransport(port, secure = null) {
  const key = `${process.env.EMAIL_HOST}:${port}:${secure}`;
  
  if (transporters.has(key)) {
    return transporters.get(key);
  }

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const missing = [];
    if (!process.env.EMAIL_HOST) missing.push('EMAIL_HOST');
    if (!process.env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!process.env.EMAIL_PASS) missing.push('EMAIL_PASS');
    throw new Error(`Email configuration missing: ${missing.join(', ')} must be set in environment variables`);
  }

  // Determine secure mode
  let isSecure = secure;
  if (isSecure === null) {
    isSecure = process.env.EMAIL_SECURE === 'true' || port === 465;
  }

  const config = {
    host: process.env.EMAIL_HOST,
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    // Don't use pooling on Render - create new connections
    pool: false,
    tls: {
      rejectUnauthorized: false
    },
    // Try different connection methods
    requireTLS: !isSecure,
    debug: false
  };

  const transporter = nodemailer.createTransport(config);
  transporters.set(key, transporter);
  
  return transporter;
}

/**
 * Reset all transporters
 */
function resetTransporters() {
  transporters.forEach((transporter) => {
    try {
      transporter.close();
    } catch (e) {
      // Ignore errors when closing
    }
  });
  transporters.clear();
}

/**
 * Send OTP email using SMTP with multiple fallback strategies
 * Tries different ports and configurations to work around Render's SMTP blocking
 */
export async function sendOtpMail(to, code) {
  const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
  
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

  // Try multiple port configurations in order of preference
  // This helps bypass Render's SMTP port blocking
  const portConfigs = [
    { port: 587, secure: false, name: 'STARTTLS (587)' },
    { port: 465, secure: true, name: 'SSL (465)' },
    { port: 2525, secure: false, name: 'Alternative (2525)' },
    { port: 25, secure: false, name: 'Standard (25)' },
  ];

  // If EMAIL_PORT is explicitly set, try that first
  if (process.env.EMAIL_PORT) {
    const customPort = Number(process.env.EMAIL_PORT);
    const customSecure = process.env.EMAIL_SECURE === 'true' || customPort === 465;
    portConfigs.unshift({ port: customPort, secure: customSecure, name: `Custom (${customPort})` });
  }

  let lastError = null;

  for (const config of portConfigs) {
    try {
      console.log(`🔄 Attempting SMTP connection via ${config.name}...`);
      
      const transport = createTransport(config.port, config.secure);
      
      // Try to verify connection (with shorter timeout)
      try {
        await Promise.race([
          transport.verify(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Verification timeout')), 10000))
        ]);
        console.log(`✅ Connection verified via ${config.name}`);
      } catch (verifyErr) {
        console.log(`⚠️  Verification skipped for ${config.name}, proceeding to send...`);
      }

      const info = await Promise.race([
        transport.sendMail({
          from,
          to,
          subject: 'Your Sonaura verification code',
          html: htmlContent,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Send timeout')), 25000))
      ]);

      console.log(`✅ OTP email sent successfully to ${to} via ${config.name} (Message ID: ${info.messageId})`);
      return info.messageId;
      
    } catch (err) {
      lastError = err;
      console.error(`❌ Failed via ${config.name}:`, {
        code: err.code,
        message: err.message,
        port: config.port
      });
      
      // Reset transporters to allow fresh connection attempts
      resetTransporters();
      
      // If it's an authentication error, don't try other ports
      if (err.code === 'EAUTH') {
        throw new Error(`SMTP authentication failed: ${err.message}. Please check your EMAIL_USER and EMAIL_PASS.`);
      }
      
      // Wait a bit before trying next configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // If all configurations failed
  const errorMsg = lastError?.code 
    ? `Failed to send email via SMTP. All port configurations failed. Last error: ${lastError.code} - ${lastError.message}`
    : `Failed to send email via SMTP. All port configurations failed. Last error: ${lastError?.message || 'Unknown error'}`;
  
  console.error(`❌ All SMTP attempts failed for ${to}`);
  throw new Error(errorMsg);
}
