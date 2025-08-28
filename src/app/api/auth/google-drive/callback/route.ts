import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Google Drive Callback Started ===');
    console.log('Request URL:', request.url);
    
    // Get the authorization code and state from the URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This contains the user ID

    console.log('OAuth parameters:', { hasCode: !!code, hasError: !!error, hasState: !!state });

    if (error) {
      console.error('Google Drive OAuth error:', error);
      return NextResponse.redirect(new URL(`/auth/error?error=${error}`, request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }

    if (!state) {
      console.error('No state parameter received');
      return NextResponse.redirect(new URL('/auth/error?error=no_state', request.url));
    }

    // The state parameter contains the user ID
    const userId = state;
    console.log('Using user ID from state parameter:', userId);

    // Create Supabase client for database operations
    console.log('Creating Supabase client...');
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log('Supabase client created successfully');

    // Exchange the authorization code for access tokens
    console.log('Starting Google OAuth token exchange...');
    const tokenRequestBody = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-drive/callback`,
      grant_type: 'authorization_code',
    };
    
    console.log('Token exchange request prepared:', {
      hasCode: !!code,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: tokenRequestBody.redirect_uri
    });
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange code for tokens:', errorText);
      return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();
    console.log('Token exchange successful!');
    console.log('Received tokens:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      tokenType: tokens.token_type,
      scope: tokens.scope
    });
    
    // ========================================
    // GET USER EMAIL FROM GOOGLE - FIXED APPROACH
    // ========================================

    console.log('Getting user info from Google...');

    // Use the access token to get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info from Google');
      return NextResponse.redirect(new URL('/auth/error?error=google_user_info_failed', request.url));
    }

    const googleUserInfo = await userInfoResponse.json();
    console.log('Google user info:', googleUserInfo);

    // Use the REAL email from Google
    const userEmail = googleUserInfo.email;
    console.log('Using real email from Google:', userEmail);

    if (!userEmail) {
      console.error('No email found in Google user info');
      return NextResponse.redirect(new URL('/auth/error?error=no_google_email', request.url));
    }

    // Store the tokens in the database
    console.log('Attempting to store tokens for user:', userEmail);

    // Prepare the insert data
    const insertData = {
      user_email: userEmail,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null
    };

    console.log('Insert data prepared:', insertData);
    console.log('Data types:', {
      user_email: typeof insertData.user_email,
      access_token: typeof insertData.access_token,
      refresh_token: typeof insertData.refresh_token,
      expires_at: typeof insertData.expires_at
    });

    console.log('Attempting database insert...');

    // Insert into the correct table
    const { error: insertError } = await supabase
      .from('google_access_tokens')
      .upsert(insertData, {
        onConflict: 'user_email'
      });

    if (insertError) {
      // Log the error to a database table for debugging
      console.error('Failed to store Google Drive tokens:', insertError);
      
      // Try to log the error to a debug table
      try {
        await supabase
          .from('debug_logs')
          .insert({
            error_type: 'google_auth_insert_failed',
            error_message: insertError.message,
            error_details: JSON.stringify(insertError),
            insert_data: JSON.stringify(insertData),
            user_email: userEmail,
            timestamp: new Date().toISOString()
          });
        console.log('Error logged to debug_logs table successfully');
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }
      
      // Return error with details in URL
      const errorDetails = encodeURIComponent(JSON.stringify({
        message: insertError.message,
        code: insertError.code,
        details: insertError.details
      }));
      
      return NextResponse.redirect(new URL(`/auth/error?error=token_storage_failed&details=${errorDetails}`, request.url));
    }
    
    console.log('Google Drive tokens stored successfully for user:', userEmail);

    // ========================================
    // SIMPLE REDIRECT - NO MAGIC LINK NEEDED
    // ========================================

    console.log('Redirecting to dashboard...');

    // Just redirect to dashboard - the user should already be logged in
    // If they're not, they'll get redirected to login, which is fine
    return NextResponse.redirect(new URL('/dashboard?google_drive_auth=success', request.url));
    
  } catch (error) {
    // Enhanced error logging
    console.error('=== GOOGLE DRIVE CALLBACK ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    console.error('=== END ERROR LOG ===');
    
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}