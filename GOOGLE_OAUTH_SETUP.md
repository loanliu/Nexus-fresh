# Google OAuth Setup for Supabase

## Prerequisites
- Supabase project with Auth enabled
- Google Cloud Console project with OAuth 2.0 credentials

## Step 1: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Enable**
4. You'll need to add:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret

## Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** and **Google Drive API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client IDs**
6. Choose **Web application**
7. Add these Authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback (for development)
   ```
8. Copy the **Client ID** and **Client Secret**

## Step 3: Configure OAuth Consent Screen (IMPORTANT!)

**This step is crucial for accepting non-Gmail users:**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type (allows any Google account)
3. Fill in required fields:
   - **App name**: Your app name
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. **Add scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - `email`
   - `profile`
5. **Add test users** (optional for development):
   - Add your email and any other test emails
   - This allows testing before verification
6. **Publish app** (for production):
   - Click "Publish app" to make it available to all users
   - **Note**: This requires Google verification for production apps

## Step 4: Update Environment Variables

Add these to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 5: Test the Flow

1. Click "Continue with Google" on your login page
2. You'll be redirected to Google for authentication
3. After Google auth, you'll be redirected to `/auth/callback`
4. Supabase will handle the OAuth callback
5. You'll be redirected to `/dashboard` with a valid session

## How It Works Now

1. **User clicks "Continue with Google"**
2. **Redirects to Supabase's Google OAuth endpoint**
3. **Supabase handles the entire OAuth flow**
4. **User gets redirected back with a valid Supabase session**
5. **Dashboard access works immediately**

## Troubleshooting

- **"Provider not enabled"**: Make sure Google OAuth is enabled in Supabase
- **"Invalid redirect URI"**: Check that your redirect URIs match exactly
- **"Client ID not found"**: Verify your Google OAuth credentials in Supabase
- **"Access blocked" for non-Gmail users**: Make sure OAuth consent screen is configured for external users

## Production Deployment Notes

### For Production Apps:
1. **OAuth Consent Screen**: Must be set to "External" user type
2. **Verification**: Google may require verification for production apps
3. **Scopes**: Only request necessary scopes
4. **Privacy Policy**: Required for production apps
5. **Terms of Service**: Required for production apps

### For Development/Testing:
1. **Test Users**: Add specific emails to test users list
2. **Unverified App**: Can test with up to 100 users
3. **Limited Scopes**: Use minimal required scopes

## Benefits of This Approach

- ✅ **Cleaner flow**: One OAuth step instead of two
- ✅ **Better security**: Supabase handles all OAuth logic
- ✅ **Automatic session management**: No need to manually create sessions
- ✅ **Built-in error handling**: Supabase provides proper error responses
- ✅ **Easier maintenance**: Less custom code to maintain
- ✅ **Universal access**: Works with any Google account (Gmail, Yahoo, etc.)
