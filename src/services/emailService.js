import nodemailer from 'nodemailer';

export function getTransport() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const secure = process.env.EMAIL_SECURE === 'true';
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

export async function sendOtpMail(to, code) {
  try {
    const transporter = getTransport();
    const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
    
    // Validate email configuration
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Email configuration missing. Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
      throw new Error('Email service not configured');
    }
    
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
    console.log(`OTP email sent to ${to}: ${info.messageId}`);
    return info.messageId;
  } catch (err) {
    console.error("OTP Email Send Error:", err);
    // Don't throw error - allow registration/login to continue even if email fails
    // In production, you might want to log this to a monitoring service
    throw new Error("Failed to send OTP email. Please check your email configuration.");
  }
}


// import nodemailer from 'nodemailer';

// let transporter = null;

// /**
//  * Create transporter only once (prevents re-creation + errors on Render)
//  */
// function getTransport() {
//   if (transporter) return transporter;

//   transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number(process.env.EMAIL_PORT || 587),
//     secure: process.env.EMAIL_SECURE === 'true',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   return transporter;
// }

// export async function sendOtpMail(to, code) {
//   const transport = getTransport();
//   const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;

//   try {
//     const info = await transport.sendMail({
//       from,
//       to,
//       subject: 'Your Sonaura verification code',
//       html: `
//         <p>Your verification code is <b>${code}</b>.</p>
//         <p>This code will expire in <b>10 minutes</b>.</p>
//       `,
//     });

//     return info.messageId;
//   } catch (err) {
//     console.error("OTP Email Send Error:", err);
//     throw new Error("Failed to send OTP email");
//   }
// }
