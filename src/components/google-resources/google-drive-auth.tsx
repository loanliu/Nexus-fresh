'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
// import { toast } from 'sonner'; // TODO: Install sonner package

export default function GoogleDriveAuth() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

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
      
      // Use the unified OAuth flow from supabaseClient
      // This will request all necessary scopes in one authentication
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }

      console.log('Google OAuth initiated successfully');

    } catch (error) {
      console.error('Google Drive authorization error:', error);
      alert(`Failed to authorize Google Drive access: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsAuthorizing(false);
    }
  };

  const disconnectGoogleDrive = async () => {
    try {
      setIsDisconnecting(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert('No user found to disconnect');
        setIsDisconnecting(false);
        return;
      }

      // Clear Google access tokens from database
      const { error: deleteError } = await supabase
        .from('google_access_tokens')
        .delete()
        .eq('user_email', user.email);

      if (deleteError) {
        console.error('Error deleting Google tokens:', deleteError);
        // Continue anyway - we'll still sign out
      }

      // Also try to clear from google_tokens table if it exists
      try {
        await supabase
          .from('google_tokens')
          .delete()
          .eq('user_id', user.id);
      } catch (e) {
        // Ignore errors if table doesn't exist
        console.log('google_tokens table not found or error clearing:', e);
      }

      // Sign out completely to clear all authentication
      await supabase.auth.signOut();
      
      alert('Google Drive disconnected successfully! Please refresh the page and sign in again.');
      
      // Refresh the page to show the fresh state
      window.location.reload();

    } catch (error) {
      console.error('Error disconnecting Google Drive:', error);
      alert(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDisconnecting(false);
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
      
      <div className="space-y-3">
        <Button
          onClick={() => {
            console.log('Button clicked!');
            authorizeGoogleDrive();
          }}
          disabled={isAuthorizing}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full"
        >
          {isAuthorizing ? 'Authorizing...' : 'Authorize Google Drive'}
        </Button>
        
        <Button
          onClick={disconnectGoogleDrive}
          disabled={isDisconnecting}
          variant="outline"
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
        >
          {isDisconnecting ? 'Disconnecting...' : '🔓 Disconnect & Start Fresh'}
        </Button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p className="mb-2">Debug: Component loaded, Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}</p>
        <p className="text-orange-600">💡 If you're having authentication issues, use the "Disconnect & Start Fresh" button above!</p>
      </div>
    </div>
  );
}
