# SMTP Email Setup Guide

## Overview

This application uses direct SMTP to send OTP emails. The system automatically tries multiple SMTP ports and configurations to work around hosting restrictions.

## Environment Variables Required

Set these in your Render dashboard (Environment tab):

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Sonaura <no-reply@sonaura.in>
EMAIL_SECURE=false
```

## Gmail Setup

1. **Enable 2-Step Verification**:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as `EMAIL_PASS` (not your regular password)

3. **Configuration**:
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  (16-char app password)
   EMAIL_SECURE=false
   ```

## How It Works

The system automatically tries multiple SMTP configurations in this order:

1. **Port 587 (STARTTLS)** - Most common, recommended
2. **Port 465 (SSL)** - Alternative secure connection
3. **Port 2525** - Alternative port (some providers)
4. **Port 25** - Standard SMTP (often blocked)

If your `EMAIL_PORT` is explicitly set, it will try that first.

## Important: Render Limitations

⚠️ **Render blocks SMTP ports (25, 587, 465)** on their free tier. This means:

- **SMTP may not work on Render** even with multiple port attempts
- The system will try all ports automatically, but if all are blocked, emails won't send
- You may see `ETIMEDOUT` or `ECONNECTION` errors in logs

### Solutions if SMTP is blocked:

1. **Use a different hosting provider** that allows SMTP (Heroku, Railway, DigitalOcean, etc.)
2. **Upgrade Render plan** - Some paid plans may allow SMTP
3. **Use a local email server** - Not practical for most use cases
4. **Contact Render support** - Ask about SMTP port availability

## Testing

1. **Local Testing**:
   ```bash
   cd backend
   node test-email.js
   ```

2. **Check Logs**:
   - Look for: `✅ OTP email sent successfully`
   - Or errors showing which ports failed

3. **Verify Email**:
   - Check inbox and spam folder
   - OTP should arrive within seconds

## Troubleshooting

| Error | Solution |
|-------|----------|
| `ETIMEDOUT` | Port is blocked by hosting provider. Try different hosting or contact support |
| `EAUTH` | Wrong password. Use Gmail App Password, not regular password |
| `ECONNECTION` | Network/firewall blocking. Check hosting provider restrictions |
| All ports fail | Hosting provider blocks SMTP. Consider alternative hosting |

## Alternative Email Providers

If Gmail doesn't work, you can use any SMTP provider:

**Outlook/Hotmail**:
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Yahoo**:
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Custom SMTP Server**:
```
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
EMAIL_SECURE=false
```

