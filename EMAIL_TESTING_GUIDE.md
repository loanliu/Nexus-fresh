# Email Testing Guide for Nexus Project Sharing

## Pre-Testing Setup

### 1. Environment Variables Check
```bash
# Verify these are set in your Netlify environment:
SMTP_HOST=smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
APP_URL=https://nextgen-aisolutions.ai
```

### 2. Test SMTP Connection
```bash
# Test if SMTP is configured correctly
curl -X GET https://your-app.netlify.app/api/test-email
```

Expected response:
```json
{
  "ok": true,
  "smtpConfigured": true,
  "appUrl": "https://nextgen-aisolutions.ai",
  "message": "SMTP connection is working correctly"
}
```

## Testing Email Functionality

### 1. Test Email Sending
```bash
# Send a test email
curl -X POST https://your-app.netlify.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

Expected response:
```json
{
  "ok": true,
  "message": "Test email sent successfully!",
  "email": "your-test-email@example.com"
}
```

### 2. Test Invite Flow
1. **Open your app** and go to Projects
2. **Click Share button** on any project
3. **Enter a real email address** (yours or a colleague's)
4. **Select a role** (Editor, Admin, or Viewer)
5. **Click "Send Invite"**
6. **Check the response** - should show email status

### 3. Check Email Delivery
1. **Check inbox** for the invitation email
2. **Check spam folder** if not in inbox
3. **Verify email content**:
   - Professional design
   - Project name displayed
   - Inviter name shown
   - Clear "Accept Invitation" button
   - Fallback link provided

### 4. Test Invite Link
1. **Click the "Accept Invitation" button** in the email
2. **Should redirect** to your app's invite accept page
3. **If not logged in** - should redirect to sign-in
4. **After sign-in** - should process the invite
5. **Should show success** and redirect to project

## Expected Email Content

### HTML Email Features:
- ✅ **Nexus branding** with logo
- ✅ **Project name** prominently displayed
- ✅ **Inviter name** (if available)
- ✅ **Professional design** with proper styling
- ✅ **Call-to-action button** that works
- ✅ **Fallback link** for accessibility
- ✅ **Expiration notice** (7 days)
- ✅ **Responsive design** for mobile

### Plain Text Version:
- ✅ **Simple format** for all email clients
- ✅ **Same information** as HTML version
- ✅ **Clear instructions** for accepting invite

## Error Scenarios to Test

### 1. SMTP Configuration Issues
- **Missing SMTP_HOST** → Should return configuration error
- **Wrong SMTP credentials** → Should return authentication error
- **Invalid SMTP_PORT** → Should return connection error

### 2. Email Delivery Issues
- **Invalid email format** → Should return validation error
- **SES sandbox mode** → Should fail for unverified emails
- **Rate limiting** → Should handle gracefully

### 3. Invite Link Issues
- **Expired token** → Should show expiration message
- **Invalid token** → Should show error message
- **Already used token** → Should show "already used" message

## Success Indicators

### ✅ Email Sent Successfully
- API returns `{ ok: true, emailSent: true }`
- Toast shows "Invite sent successfully! Check your email."
- Email appears in recipient's inbox
- Email has proper formatting and content

### ✅ Email Failed but Invite Created
- API returns `{ ok: true, emailSent: false }`
- Toast shows "Invite created! Email failed to send, but you can copy the link below."
- Invite still appears in pending invites list
- Copy link functionality still works

### ✅ Invite Link Works
- Clicking email link redirects to app
- Authentication flow works correctly
- Invite is processed successfully
- User becomes project member
- Redirects to project dashboard

## Troubleshooting

### Email Not Received
1. **Check spam folder**
2. **Verify sender email** is verified in SES
3. **Check SES console** for sending statistics
4. **Verify SMTP credentials** are correct
5. **Check Netlify function logs**

### Invite Link Not Working
1. **Check APP_URL** is set correctly
2. **Verify token** is being generated
3. **Check accept page** is deployed
4. **Test with different browsers**

### SMTP Connection Failed
1. **Verify all environment variables** are set
2. **Check AWS SES** is configured correctly
3. **Ensure credentials** are for correct region
4. **Test with AWS SES console** directly

## Production Checklist

- [ ] SMTP credentials configured in Netlify
- [ ] Sender email verified in AWS SES
- [ ] Production access granted (if needed)
- [ ] Test email sent successfully
- [ ] Invite flow tested end-to-end
- [ ] Email templates look professional
- [ ] Error handling works correctly
- [ ] Monitoring set up for email failures

## Monitoring

### Key Metrics to Watch:
- **Email delivery rate** (successful sends)
- **Email open rate** (if tracking enabled)
- **Invite acceptance rate** (clicks on links)
- **SMTP connection errors**
- **Failed email sends**

### Logs to Check:
- **Netlify function logs** for API errors
- **AWS CloudWatch logs** for SES issues
- **Browser console** for frontend errors
- **Supabase logs** for database issues
