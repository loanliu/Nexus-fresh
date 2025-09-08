'use client';

import { supabase } from './supabase'; // Import the shared client instead of creating a new one
import { Database } from '@/types/supabase';

// Export the supabase client directly for use in other files
export { supabase };

// Supabase configuration
//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
//const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;


// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  // Sign in with email and password
  signInWithPassword: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  // Sign in with magic link
  signInWithMagicLink: async (email: string) => {
    console.log('Attempting magic link for email:', email);
    console.log('Redirect URL will be:', `${window.location.origin}/auth/callback`);
    
    const result = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true, // Allow creating new users
      },
    });
    
    console.log('Magic link API response:', result);
    console.log('Response data:', result.data);
    console.log('Response error:', result.error);
    
    return result;
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    console.log('Starting Google OAuth sign-in...');
    console.log('Redirect URL:', `${window.location.origin}/auth/callback`);
    
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'openid email profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: 'true',
        },
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false, // Ensure browser redirect happens
      },
    });
    
    console.log('Google OAuth result:', result);
    return result;
  },

  // Sign out
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // Get current session
  getSession: async () => {
    return await supabase.auth.getSession();
  },

  // Get current user
  getUser: async () => {
    return await supabase.auth.getUser();
  },

  // Exchange code for session (for OAuth callbacks)
  exchangeCodeForSession: async (authCode: string) => {
    console.log('Exchanging code for session:', authCode);
    const result = await supabase.auth.exchangeCodeForSession(authCode);
    console.log('Exchange result:', result);
    return result;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Reset password
  resetPassword: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  // Update password
  updatePassword: async (password: string) => {
    return await supabase.auth.updateUser({ password });
  },
};

// Database helper
export const db = supabase;

// Direct exports for easier importing
export const signInWithMagicLink = auth.signInWithMagicLink;
export const signInWithGoogle = auth.signInWithGoogle;
export const signInWithPassword = auth.signInWithPassword;
export const resetPassword = auth.resetPassword;

export default supabase;
