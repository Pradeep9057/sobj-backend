# Render Environment Variables Setup

## Quick Setup for Mailgun API

Add these environment variables in your Render dashboard:

### Step 1: Go to Render Dashboard
1. Navigate to your backend service on Render
2. Click on **Environment** tab
3. Click **Add Environment Variable**

### Step 2: Add These Variables

Add each variable one by one:

```
MAILGUN_API_KEY=610e980c84fda60bf800d10ff79fdee2-04af4ed8-f1604056
```

```
MAILGUN_DOMAIN=sandbox212a53f7b5474dd7b8bfe5b14c4a810b.mailgun.org
```

```
EMAIL_FROM=Sonaura <no-reply@sonaura.in>
```

### Step 3: Remove Old SMTP Variables (Optional)

You can remove these if they exist (they won't be used when Mailgun API is configured):
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_SECURE`

### Step 4: Redeploy

After adding the variables:
1. Click **Save Changes**
2. Render will automatically redeploy
3. Wait for deployment to complete

### Step 5: Test

1. Try signing up or logging in
2. Check Render logs - you should see:
   ```
   ✅ OTP email sent via Mailgun API to your@email.com
   ```

### Important: Authorize Recipients (Sandbox Domain)

Since you're using a Mailgun sandbox domain, you can only send emails to **authorized recipients**.

To authorize your email:
1. Go to Mailgun Dashboard
2. Click on your domain: `sandbox212a53f7b5474dd7b8bfe5b14c4a810b.mailgun.org`
3. Go to **Authorized Recipients** tab
4. Click **Add Recipient**
5. Enter your email address (e.g., `pradeepkumarsoni2002@gmail.com`)
6. Check your email and click the verification link
7. Now you can receive OTP emails!

### Troubleshooting

**If emails aren't being sent:**
- Check Render logs for error messages
- Verify environment variables are set correctly (no extra spaces)
- Make sure your email is authorized in Mailgun dashboard
- Check Mailgun dashboard → Logs to see delivery status

**If you see "Unauthorized" error:**
- Double-check the API key is correct (copy-paste exactly)
- Make sure there are no extra spaces before/after the value

