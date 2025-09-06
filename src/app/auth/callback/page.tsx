'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const hasHandledError = useRef(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL
        const url = window.location.href;
        
        // Check if we have an auth code or error in the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        console.log('Auth callback URL:', url);
        console.log('URL params:', { code, error, errorDescription });

        if (error) {
          console.error('Auth error:', error, errorDescription);
          if (!hasHandledError.current) {
            hasHandledError.current = true;
            setStatus('error');
            setMessage(errorDescription || 'Authentication failed. Please try again.');
            
            // Redirect to login after showing error
            setTimeout(() => {
              router.push('/');
            }, 3000);
          }
          return;
        }

        if (code) {
          // This is an OAuth flow (Google, etc.)
          console.log('OAuth code found, exchanging for session...');
          console.log('Full URL:', url);
          
          try {
            const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(url);
            
            console.log('Session exchange result:', { 
              hasSession: !!data.session, 
              hasUser: !!data.user,
              error: sessionError?.message 
            });
            
            if (sessionError) {
              console.error('Session exchange error:', sessionError);
              if (!hasHandledError.current) {
                hasHandledError.current = true;
                setStatus('error');
                setMessage(`Authentication failed: ${sessionError.message || 'Please try again.'}`);
                
                setTimeout(() => {
                  router.push('/');
                }, 3000);
              }
              return;
            }

            if (data.session) {
              setStatus('success');
              setMessage('Authentication successful! Redirecting...');
              
              // Check for returnUrl in localStorage (set by signin page)
              const returnUrl = localStorage.getItem('returnUrl');
              console.log('🔍 Auth callback - returnUrl from localStorage:', returnUrl);
              if (returnUrl) {
                localStorage.removeItem('returnUrl');
                console.log('🔍 Redirecting to returnUrl:', returnUrl);
                setTimeout(() => {
                  window.location.href = returnUrl;
                }, 1500);
              } else {
                console.log('🔍 No returnUrl found, redirecting to home');
                setTimeout(() => {
                  router.push('/');
                }, 1500);
              }
            } else {
              if (!hasHandledError.current) {
                hasHandledError.current = true;
                setStatus('error');
                setMessage('No session created. Please try again.');
                
                setTimeout(() => {
                  router.push('/');
                }, 3000);
              }
            }
          } catch (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            if (!hasHandledError.current) {
              hasHandledError.current = true;
              setStatus('error');
              setMessage('Failed to complete authentication. Please try again.');
              
              setTimeout(() => {
                router.push('/');
              }, 3000);
            }
          }
        } else {
          // For Magic Links, check if we have a session
          // Magic Links should automatically create a session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log('Session data:', sessionData);
          console.log('Session error:', sessionError);
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            if (!hasHandledError.current) {
              hasHandledError.current = true;
              setStatus('error');
              setMessage('Failed to get session. Please try again.');
              
              setTimeout(() => {
                router.push('/');
              }, 3000);
            }
            return;
          }
          
          if (sessionData.session) {
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            // Check for returnUrl in localStorage (set by signin page)
            const returnUrl = localStorage.getItem('returnUrl');
            console.log('🔍 Auth callback (Magic Link) - returnUrl from localStorage:', returnUrl);
            if (returnUrl) {
              localStorage.removeItem('returnUrl');
              console.log('🔍 Redirecting to returnUrl:', returnUrl);
              setTimeout(() => {
                window.location.href = returnUrl;
              }, 1500);
            } else {
              console.log('🔍 No returnUrl found, redirecting to home');
              setTimeout(() => {
                router.push('/');
              }, 1500);
            }
          } else {
            if (!hasHandledError.current) {
              hasHandledError.current = true;
              setStatus('error');
              setMessage('No session found. Please try signing in again.');
              
              setTimeout(() => {
                router.push('/');
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        // Only set error if we haven't already set one
        if (!hasHandledError.current) {
          hasHandledError.current = true;
          setStatus('error');
          setMessage('An unexpected error occurred. Please try again.');
          
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 flex items-center justify-center mb-6">
            {status === 'loading' && <LoadingSpinner className="w-16 h-16" />}
            {status === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Welcome to Nexus!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
              <p className="text-sm text-gray-500">Please wait while we complete your sign-in...</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                You will be redirected to the login page in a few seconds.
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                Setting up your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}