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
     console.log('User ID details:', {
       value: userId,
       type: typeof userId,
       length: userId?.length,
       isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '')
     });

     // Create Supabase client for database operations
     const cookieStore = await cookies();
     const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

          // Test database connection and permissions
     console.log('Testing database connection and permissions...');
     
     // Test 1: Can we read from the table?
     const { data: testData, error: testError } = await supabase
       .from('google_tokens')
       .select('count')
       .limit(1);
     
     if (testError) {
       console.error('Database read test failed:', testError);
       return NextResponse.redirect(new URL('/auth/error?error=database_read_failed', request.url));
     }
     
     console.log('Database read test successful');
     
     // Try to create a minimal user profile to satisfy foreign key constraint
     console.log('Attempting to create minimal user profile...');
     
     // Log the user ID we're working with
     console.log('Working with user ID:', {
       value: userId,
       type: typeof userId,
       length: userId?.length,
       isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '')
     });
     
     // Try to create a basic user profile
     const { error: profileError } = await supabase
       .from('users')
       .insert({
         id: userId,
         email: 'google-drive-user@temp.com',
         full_name: 'Google Drive User',
         avatar_url: null
       })
       .select()
       .single();
     
     if (profileError) {
       console.log('Profile creation failed (this might be expected if user already exists):', profileError.message);
       // Continue anyway - the user might already exist
     } else {
       console.log('User profile created or already exists');
     }

    // Exchange the authorization code for access tokens
    const tokenRequestBody = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-drive/callback`,
      grant_type: 'authorization_code',
    };
    
    console.log('Token exchange request:', {
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
      console.error('Failed to exchange code for tokens:', await tokenResponse.text());
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
     
     // Store the tokens in the database
     console.log('Attempting to store tokens for user:', userId);

    // Prepare the insert data
    const insertData = {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : new Date(Date.now() + 3600 * 1000).toISOString(),
      scope: tokens.scope || 'https://www.googleapis.com/auth/drive.readonly'
    };

    console.log('Insert data prepared:', insertData);
    console.log('Data types:', {
      user_id: typeof insertData.user_id,
      access_token: typeof insertData.access_token,
      refresh_token: typeof insertData.refresh_token,
      expires_at: typeof insertData.expires_at,
      scope: typeof insertData.scope
    });

    console.log('Insert data prepared:', insertData);

    console.log('Attempting database insert...');
    
    const { error: insertError } = await supabase
      .from('google_tokens')
      .upsert(insertData, {
        onConflict: 'user_id'
      });

         if (insertError) {
       console.error('Failed to store Google Drive tokens:', insertError);
       console.error('Error details:', {
         message: insertError.message,
         details: insertError.details,
         hint: insertError.hint,
         code: insertError.code
       });
       
       console.error('Insert data that failed:', insertData);
       console.error('User ID type:', typeof userId);
       console.error('User ID value:', userId);
       
       return NextResponse.redirect(new URL('/auth/error?error=token_storage_failed', request.url));
     }

    console.log('Google Drive tokens stored successfully for user:', userId);
    
    // Redirect back to dashboard with success message
    return NextResponse.redirect(new URL('/dashboard?google_drive_auth=success', request.url));
    
  } catch (error) {
    console.error('Google Drive callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}
