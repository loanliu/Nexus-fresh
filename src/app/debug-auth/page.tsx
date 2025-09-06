'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null);
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      // Check cookies
      const allCookies = document.cookie.split(';');
      setCookies(allCookies);

      // Check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      setAuthState({
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: error?.message,
        sessionData: session
      });
    };

    checkAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Cookies ({cookies.length})</h2>
          <div className="bg-gray-100 p-2 rounded">
            {cookies.length === 0 ? (
              <p>No cookies found</p>
            ) : (
              cookies.map((cookie, index) => (
                <div key={index} className="text-sm font-mono">
                  {cookie.trim()}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Supabase Auth State</h2>
          <div className="bg-gray-100 p-2 rounded">
            <pre className="text-sm">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
        </div>

        <div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
