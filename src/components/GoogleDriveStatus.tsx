'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export function GoogleDriveStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastConnected, setLastConnected] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('google_access_tokens')
          .select('*')
          .eq('user_email', user.email)
          .single();

        if (!error && data) {
          setIsConnected(true);
          setLastConnected(data.created_at || data.updated_at);
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Failed to check Google Drive connection:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [user]);

  if (!user || isLoading) {
    return null;
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Google Drive Status</h3>
      {isConnected ? (
        <div className="space-y-2">
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Connected to Google Drive
          </div>
          {lastConnected && (
            <p className="text-sm text-gray-500">
              Connected: {new Date(lastConnected).toLocaleDateString()}
            </p>
          )}
          <p className="text-sm text-gray-600">
            You can now access and manage your Google Drive files.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center text-gray-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Not connected to Google Drive
          </div>
          <p className="text-sm text-gray-600">
            Connect your Google Drive to access your files.
          </p>
        </div>
      )}
    </div>
  );
}