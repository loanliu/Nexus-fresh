import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

export function GoogleDriveConnect() {
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        try {
          // First try to find tokens by user_id (preferred method)
          let { data } = await supabase
            .from('google_access_tokens')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          // If no tokens found by user_id, try by user_email (legacy method)
          if (!data) {
            const { data: emailData } = await supabase
              .from('google_access_tokens')
              .select('id')
              .eq('user_email', user.email)
              .maybeSingle();
            data = emailData;
          }
          
          setIsConnected(!!data);
        } finally {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };
    init();
  }, []);

  const handleDisconnect = async () => {
    if (!user) return;
    
    try {
      setIsDisconnecting(true);
      
      // Clear Google access tokens from database
      const { error } = await supabase
        .from('google_access_tokens')
        .delete()
        .eq('user_email', user.email);

      if (error) {
        console.error('Error deleting Google tokens:', error);
        alert('Failed to disconnect. Please try again.');
        return;
      }

      // Update local state
      setIsConnected(false);
      
      alert('Google Drive disconnected successfully! Please refresh the page.');
      
    } catch (error) {
      console.error('Error disconnecting Google Drive:', error);
      alert(`Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!user || checking) return null;

  // Show connected state with disconnect button
  if (isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-green-800">Google Drive Connected</h3>
        <p className="text-green-700 mb-3">
          ✅ Your Google Drive is successfully connected and ready to use.
        </p>
        
        {/* Disconnect Button */}
        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="text-red-600 border-red-300 hover:bg-red-50 w-full border"
        >
          {isDisconnecting ? 'Disconnecting...' : '🔓 Disconnect Google Drive'}
        </Button>
      </div>
    );
  }

  const handleConnectGoogleDrive = async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      // Use the unified OAuth flow from supabaseClient
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
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert(`Failed to connect to Google: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Google Drive Connection</h3>
      <p className="text-gray-600 mb-4">
        Connect your Google Drive to access and manage your files directly from this app.
      </p>
      <Button
        onClick={handleConnectGoogleDrive}
        disabled={isConnecting}
        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
      >
        {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
      </Button>
    </div>
  );
}