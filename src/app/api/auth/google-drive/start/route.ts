import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1) Require the user to be logged in (optional: redirect to your own login first)
  // If you want to *enforce* Supabase session here, you can import your server client and check.
  // Skipping for brevity.

  // 2) Generate a CSRF state and save it in a secure cookie
  const state = crypto.randomBytes(32).toString('hex');
  (await cookies()).set('gd_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes
  });

  // 3) Build the Google authorize URL (THIS is where offline + consent go)
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/google-drive/callback`,
    response_type: 'code',
    // ↓↓↓ THESE TWO ARE THE KEY FOR REFRESH TOKENS ↓↓↓
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    // Ask for Drive + basic identity (so you can call /userinfo or read id_token)
    scope: [
      'openid',
      'email',
      'profile',
    ].join(' '),
    state,
  });

  const authorizeUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authorizeUrl);
}