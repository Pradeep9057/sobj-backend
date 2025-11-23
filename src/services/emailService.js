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
  const transporter = getTransport();
  const from = process.env.EMAIL_FROM || `Sonaura <no-reply@sonaura.in>`;
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Your Sonaura verification code',
    html: `<p>Your verification code is <b>${code}</b>. It expires in 10 minutes.</p>`
  });
  return info.messageId;
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
