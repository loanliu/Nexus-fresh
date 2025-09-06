'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AcceptInviteState {
  status: 'loading' | 'success' | 'error';
  message: string;
  projectId?: string;
  projectName?: string;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<AcceptInviteState>({
    status: 'loading',
    message: 'Processing invite...'
  });

  useEffect(() => {
    const acceptInvite = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setState({
            status: 'error',
            message: 'Invalid invite link - no token provided'
          });
          return;
        }

        // Check if user is authenticated with retry logic
        let session = null;
        let authError = null;
        
        // Try to get session with retries (in case of timing issues)
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: { session: currentSession }, error: currentError } = await supabase.auth.getSession();
          session = currentSession;
          authError = currentError;
          
          if (session && session.user) {
            break; // Session found, exit retry loop
          }
          
          if (attempt < 2) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (authError || !session || !session.user) {
          // Redirect to sign in with return URL
          const returnUrl = encodeURIComponent(window.location.href);
          router.push(`/auth/signin?returnUrl=${returnUrl}`);
          return;
        }

        // Call the accept invite API with access token
        const response = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session.access_token ? `Bearer ${session.access_token}` : '',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setState({
            status: 'success',
            message: data.message || 'Successfully joined the project!',
            projectId: data.projectId,
            projectName: data.projectName
          });

          // Show success toast
          toast.success(data.message || 'Successfully joined the project!');

          // Redirect to the project after a short delay
          setTimeout(() => {
            router.push(`/dashboard?tab=projects&projectId=${data.projectId}`);
          }, 2000);
        } else {
          setState({
            status: 'error',
            message: data.error || 'Failed to accept invite'
          });
          
          // Show error toast
          toast.error(data.error || 'Failed to accept invite');
        }
      } catch (error) {
        console.error('Error accepting invite:', error);
        setState({
          status: 'error',
          message: 'An unexpected error occurred'
        });
        toast.error('An unexpected error occurred');
      }
    };

    acceptInvite();
  }, [searchParams, router]);

  const renderContent = () => {
    switch (state.status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Invite
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              {state.message}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-green-100 rounded-full p-3 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Welcome to the Project!
            </h2>
            <p className="text-gray-700 text-center max-w-md mb-4">
              {state.message}
            </p>
            {state.projectName && (
              <p className="text-lg font-semibold text-gray-900 mb-4">
                {state.projectName}
              </p>
            )}
            <div className="text-sm text-gray-500">
              Redirecting to the project...
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-red-100 rounded-full p-3 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Unable to Accept Invite
            </h2>
            <p className="text-gray-700 text-center max-w-md mb-6">
              {state.message}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
