# Email Setup Guide for Nexus Project Sharing

## Environment Variables Required

### SMTP Configuration (AWS SES)
```bash
# SMTP Settings for AWS SES
SMTP_HOST=smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password

# App Configuration
APP_URL=https://nextgen-aisolutions.ai
NEXT_PUBLIC_APP_URL=https://nextgen-aisolutions.ai

# Supabase Configuration (if not already set)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Setting Up AWS SES

### 1. Create SES SMTP Credentials
1. Go to AWS SES Console
2. Navigate to "SMTP settings"
3. Click "Create my SMTP credentials"
4. Enter a name for your credentials
5. Download the credentials (you'll get SMTP_USER and SMTP_PASS)

### 2. Verify Email Addresses (Sandbox Mode)
- In SES Console, go to "Verified identities"
- Add and verify the email address you want to send from
- For production, request production access to send to any email

### 3. Configure SMTP Settings
- Use the SMTP endpoint for your region (e.g., `smtp.us-east-1.amazonaws.com`)
- Port: 587 (TLS) or 465 (SSL)
- Authentication: Use your SMTP credentials

## Netlify Deployment

### 1. Add Environment Variables
1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add each variable from the list above

### 2. Deploy
- Push your changes to trigger a new deployment
- The email functionality will be available after deployment

## Testing Email Functionality

### 1. Test SMTP Connection
```bash
# You can test the SMTP connection by calling the API
curl -X POST https://your-app.netlify.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### 2. Test Invite Flow
1. Go to your app
2. Open a project
3. Click Share button
4. Send an invite to a real email address
5. Check the recipient's inbox

## Email Template Features

### HTML Email Includes:
- Professional design with Nexus branding
- Project name and inviter information
- Clear call-to-action button
- Fallback link if button doesn't work
- Expiration notice (7 days)
- Responsive design for mobile

### Plain Text Version:
- Simple text format for email clients that don't support HTML
- Same information as HTML version
- Easy to read and understand

## Troubleshooting

### Common Issues:

#### 1. SMTP Authentication Failed
- Check SMTP_USER and SMTP_PASS are correct
- Ensure credentials are for the correct AWS region
- Verify SES is not in sandbox mode (if sending to unverified emails)

#### 2. Email Not Received
- Check spam/junk folder
- Verify sender email is verified in SES
- Check SES sending limits and quotas
- Look at CloudWatch logs for SES errors

#### 3. Invite Link Not Working
- Verify APP_URL is set correctly
- Check if the token is being generated properly
- Ensure the accept page is deployed

### Debug Steps:
1. Check Netlify function logs
2. Verify environment variables are set
3. Test SMTP connection separately
4. Check AWS SES console for sending statistics

## Security Considerations

### SMTP Credentials:
- Store credentials securely in environment variables
- Never commit credentials to version control
- Use IAM roles when possible instead of hardcoded credentials

### Email Content:
- No sensitive information in email content
- Invite links expire after 7 days
- Tokens are cryptographically secure

## Production Checklist

- [ ] SMTP credentials configured
- [ ] Sender email verified in SES
- [ ] Production access requested (if needed)
- [ ] Environment variables set in Netlify
- [ ] Email templates tested
- [ ] Invite flow tested end-to-end
- [ ] Error handling tested
- [ ] Monitoring set up for email failures
