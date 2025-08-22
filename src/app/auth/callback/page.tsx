'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash/fragment
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/error?error=auth_failed');
          return;
        }

        if (session?.user) {
          // Successfully authenticated, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session found, redirect to login
          router.push('/');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        router.push('/auth/error?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Completing authentication...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete your sign-in.
        </p>
      </div>
    </div>
  );
}
