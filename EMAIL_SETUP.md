# Email Configuration - Troubleshooting Guide

## Current Error
- **Error**: Connection timeout when sending OTP emails via Gmail SMTP
- **Status**: OTP is generated and saved in database, but email is not being sent

## Quick Fix Checklist

### Option 1: Fix Gmail App Password (RECOMMENDED)
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy the **entire** password (remove spaces if any)
5. Update `backend/.env`:
   ```
   EMAIL_PASS=<paste-the-new-password-here>
   ```
6. Restart the backend server
7. Test with: `node test-email.js`

### Option 2: Enable Less Secure App Access
If you don't have 2-Step Verification enabled:
1. Go to: https://myaccount.google.com/lesssecureapps
2. Turn on "Less secure app access"
3. Keep `EMAIL_PASS` as your regular Gmail password
4. Restart the backend server

### Option 3: Use Alternative Email Service (BEST FOR PRODUCTION)

#### Mailgun (Easy to set up)
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-mailgun-domain.com
EMAIL_PASS=your-mailgun-api-key
EMAIL_FROM=Sonaura <noreply@your-mailgun-domain.com>
EMAIL_SECURE=false
```
- Sign up at: https://www.mailgun.com
- Free tier: 1000 emails/month

#### SendGrid (Popular)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=Sonaura <noreply@your-domain.com>
EMAIL_SECURE=false
```
- Sign up at: https://sendgrid.com
- Free tier: 100 emails/day

## Testing Your Configuration

### Step 1: Test Email Connection
```bash
cd backend
node test-email.js
```

This will:
- ✅ Verify SMTP connection
- ✅ Test authentication
- ✅ Send a test email
- 🔍 Show detailed error messages

### Step 2: Check Gmail Inbox
- Check your **Inbox** for the test email
- Check **Spam** folder (if not in inbox)
- Check **All Mail** folder

### Step 3: Restart Backend
After fixing `.env`:
```bash
npm run dev
# or
node src/index.js
```

## Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNECTION` | Cannot connect to SMTP server | Check EMAIL_HOST, EMAIL_PORT, firewall |
| `ETIMEDOUT` | Connection timeout | Increase timeout, check network |
| `EAUTH` | Authentication failed | Verify EMAIL_USER and EMAIL_PASS |
| `421 Service Unavailable` | Gmail rate limiting | Wait a minute, retry |
| `535 Incorrect authentication` | Wrong password | Use Gmail App Password |

## Debug Mode

To see detailed logs, update `backend/.env`:
```env
NODE_ENV=development
```

This will print:
- Full email configuration (with password hidden)
- Detailed error messages
- SMTP connection logs
- OTP codes in console

## Verify OTP in Database

If email is failing but you want to test login:
1. Find the OTP code in server logs
2. Example: `📧 OTP for email@example.com: 907869`
3. Use that code in the OTP verification form

## Important Notes

⚠️ **Security**: Never share your EMAIL_PASS in public repositories!
✅ **App Password**: Is more secure than regular password
📧 **Gmail**: May require app password for "Less Secure" access
🔄 **Render Deployment**: May need to re-deploy after changing `.env`

## Next Steps

1. Run `node test-email.js` to diagnose the issue
2. Choose Option 1, 2, or 3 above
3. Update `.env` with correct credentials
4. Restart backend
5. Test OTP flow again
