import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function GoogleDriveConnect() {
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        try {
          const { data } = await supabase
            .from('google_access_tokens')
            .select('id')
            .eq('user_email', user.email)
            .single();
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

  if (!user || checking) return null;

  // Show connected state instead of hiding completely
  if (isConnected) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-green-800">Google Drive Connected</h3>
        <p className="text-green-700">
          ✅ Your Google Drive is successfully connected and ready to use.
        </p>
      </div>
    );
  }

  const handleConnectGoogleDrive = async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/api/auth/google-drive/callback')}&` +
        `state=${user.id}`;
      window.location.href = googleAuthUrl;
    } finally {
      setIsConnecting(false);
    }
    // Note: isConnecting will stay true until page redirects
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Google Drive Connection</h3>
      <p className="text-gray-600 mb-4">
        Connect your Google Drive to access and manage your files directly from this app.
      </p>
      <button
        onClick={handleConnectGoogleDrive}
        disabled={isConnecting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
      </button>
    </div>
  );
}