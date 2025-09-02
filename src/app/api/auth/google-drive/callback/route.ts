import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Google Drive callback received');
    
    // Get parameters from Google's redirect
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the user ID from your component
    const error = searchParams.get('error');
    
    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect('/dashboard?error=oauth_error');
    }
    
    if (!code || !state) {
      console.error('❌ Missing code or state parameter');
      return NextResponse.redirect('/dashboard?error=missing_params');
    }
    
    console.log('✅ Using user ID from state parameter:', state);
    
    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-drive/callback`
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      console.error('❌ No access token received');
      return NextResponse.redirect('/dashboard?error=no_access_token');
    }
    
    console.log('✅ Tokens received successfully');
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    if (!userInfo.email) {
      console.error('❌ No user email from Google');
      return NextResponse.redirect('/dashboard?error=no_user_email');
    }
    
    console.log('✅ User info received:', userInfo.email);
    
    // Save tokens to database
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user from the state parameter (user ID)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error getting current user:', userError);
      return NextResponse.redirect('/dashboard?error=user_not_found');
    }
    
    const tokenData = {
      user_id: user.id, // Add user_id for the new system
      user_email: userInfo.email, // Keep user_email for backward compatibility
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      updated_at: new Date()
    };
    
    const { error: upsertError } = await supabase
      .from('google_access_tokens')
      .upsert(tokenData, {
        onConflict: 'user_email'
      });
    
    if (upsertError) {
      console.error('❌ Error saving tokens:', upsertError);
      return NextResponse.redirect('/dashboard?error=save_tokens_failed');
    }
    
    console.log('✅ Tokens saved successfully');
    
    // Redirect back to dashboard with success
    return NextResponse.redirect('/dashboard?success=google_drive_connected');
    
  } catch (error) {
    console.error('❌ Unexpected error in callback:', error);
    return NextResponse.redirect('/dashboard?error=callback_failed');
  }
}