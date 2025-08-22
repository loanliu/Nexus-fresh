'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
// import { toast } from 'sonner'; // TODO: Install sonner package

export default function GoogleDriveAuth() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  console.log('GoogleDriveAuth component rendered');
  console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  const authorizeGoogleDrive = async () => {
    try {
      setIsAuthorizing(true);
      
      // Check if Google Client ID is configured
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        alert('Google Client ID not configured. Please check your environment variables.');
        setIsAuthorizing(false);
        return;
      }
      
             // Get the current user to pass their ID in the OAuth state
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       
       if (userError || !user) {
         alert('Please sign in first');
         setIsAuthorizing(false);
         return;
       }

       console.log('Supabase Auth user:', {
         id: user.id,
         email: user.email,
         idType: typeof user.id,
         idLength: user.id?.length
       });
       
       // Also check if this user exists in the public.users table
       const { data: dbUser, error: dbError } = await supabase
         .from('users')
         .select('id, email')
         .eq('id', user.id)
         .single();
       
       if (dbError) {
         console.error('User not found in public.users table:', dbError);
         console.error('This suggests the user profile wasn\'t created properly');
       } else {
         console.log('User found in public.users table:', dbUser);
       }

       console.log('Starting Google Drive authorization for user:', user.id);
       
       // Build Google OAuth URL with user ID in state parameter
       const redirectUri = `${window.location.origin}/api/auth/google-drive/callback`;
       const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
         `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}` +
         `&redirect_uri=${encodeURIComponent(redirectUri)}` +
         `&response_type=code` +
         `&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.readonly')}` +
         `&access_type=offline` +
         `&prompt=consent` +
         `&state=${encodeURIComponent(user.id)}`;

       console.log('Google OAuth URL built successfully');

      console.log('Google OAuth URL:', googleAuthUrl);
      console.log('Redirect URI:', redirectUri);
      console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

      // Use direct redirect instead of popup to avoid COOP issues
      window.location.href = googleAuthUrl;

    } catch (error) {
      console.error('Google Drive authorization error:', error);
      alert(`Failed to authorize Google Drive access: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Access Google Drive
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        To view your Google Drive documents, you need to authorize access to your Drive.
      </p>
      <Button
        onClick={() => {
          console.log('Button clicked!');
          authorizeGoogleDrive();
        }}
        disabled={isAuthorizing}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isAuthorizing ? 'Authorizing...' : 'Authorize Google Drive'}
      </Button>
      <div className="mt-2 text-xs text-gray-500">
        Debug: Component loaded, Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}
      </div>
    </div>
  );
}
