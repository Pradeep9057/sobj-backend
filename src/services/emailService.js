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


