# Mailgun Email Setup Guide

## Problem
Gmail SMTP is timing out (ETIMEDOUT) - connection cannot be established. This is common when:
- ISP/Network blocks SMTP port 587
- Gmail rate limiting
- Firewall restrictions
- Deployed on restrictive hosting

## Solution: Use Mailgun
Mailgun is a dedicated email service provider that is specifically designed for transactional emails and doesn't have the connection issues Gmail has.

## ✅ Step 1: Create Mailgun Account

1. Go to: https://www.mailgun.com
2. Click "Sign Up" 
3. Create a free account (includes 1000 emails/month)
4. Verify your email

## ✅ Step 2: Get Your Mailgun Credentials

1. After login, go to **Dashboard**
2. Look for your **Sandbox Domain** (should look like: `sandboxe326c1bc9ece48b8ad00df3fb6e8b3e5.mailgun.org`)
3. Click on the domain to open details
4. Under "SMTP Information" you'll see:
   - **SMTP Username**: `postmaster@sandboxe326c1bc9ece48b8ad00df3fb6e8b3e5.mailgun.org`
   - **SMTP Password**: An API key (looks like: `abc123def456ghi789jkl012mno345pq`)

## ✅ Step 3: Update Backend .env

Open `backend/.env` and update:

```env
# Email Configuration - Using Mailgun
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@sandboxe326c1bc9ece48b8ad00df3fb6e8b3e5.mailgun.org
EMAIL_PASS=abc123def456ghi789jkl012mno345pq
EMAIL_FROM=Sonaura <no-reply@sonaura.in>
EMAIL_SECURE=false
```

**Replace:**
- `sandboxe326c1bc9ece48b8ad00df3fb6e8b3e5` with YOUR sandbox domain
- `abc123def456ghi789jkl012mno345pq` with YOUR API password

## ✅ Step 4: Test Connection

```bash
cd backend
node test-email.js
```

Expected output:
```
✅ Mailgun is ready to send emails!
✅ Email sent successfully!
   To: pradeepkumarsoni2002@gmail.com
   Message ID: <xxxx@sandboxe326c1bc9ece48b8ad00df3fb6e8b3e5.mailgun.org>
```

## ✅ Step 5: Test OTP Flow

1. Restart backend server:
   ```bash
   npm run dev
   ```

2. Try signing up with a test email

3. Check your email inbox for the OTP

## 🚀 Production Domain (After Testing)

Once testing is complete with sandbox domain, you can add a real domain:

1. In Mailgun dashboard, click "Add Domain"
2. Add your domain (e.g., `mail.sonaura.in`)
3. Follow verification steps
4. Update `.env` with your production domain credentials

```env
EMAIL_USER=postmaster@mail.sonaura.in
EMAIL_PASS=<your-production-api-key>
EMAIL_FROM=Sonaura <noreply@mail.sonaura.in>
```

## 📧 Verify Emails Are Sending

In Mailgun dashboard:
1. Click on your domain
2. Click "Logs" tab
3. You'll see all sent/failed emails
4. Delivery status and any bounce reasons

## Troubleshooting

| Error | Solution |
|-------|----------|
| `EAUTH` | Wrong API key, copy exactly from Mailgun dashboard |
| `ETIMEDOUT` | Try again, or contact Mailgun support |
| Email not received | Check Mailgun logs and spam folder |
| `Cannot find sandbox domain` | Make sure you're in correct Mailgun account |

## Costs

- **Sandbox Domain**: 1000 emails/month (FREE)
- **Production Domain**: $35/month gets 50,000 emails/month
- Pay-as-you-go available

## Render Deployment

After updating .env with Mailgun credentials:

1. Push changes to GitHub
2. Go to Render dashboard
3. Redeploy backend
4. Mailgun will work on Render!

## Support

- Mailgun Support: https://www.mailgun.com/support
- For issues, check Mailgun logs for delivery status
