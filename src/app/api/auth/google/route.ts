import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;
    
    if (!supabaseUrl) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_supabase_url', request.url));
    }
    
    // Redirect to Supabase's built-in Google OAuth provider
    const authUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;
    
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('Google OAuth redirect error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=redirect_failed', request.url));
  }
}
