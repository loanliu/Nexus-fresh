import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(new URL('/auth/error?error=' + error, request.url));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }
    
    // Exchange authorization code for access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL('/auth/error?error=no_access_token', request.url));
    }
    
    // Store tokens in cookies or session (for demo purposes, we'll redirect with tokens)
    // In production, you'd want to store these securely in a database or session
    const response = NextResponse.redirect(new URL('/auth/success', request.url));
    
    // Set cookies with tokens (you might want to encrypt these in production)
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 3600 // 30 days
      });
    }
    
    return response;
    
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}
