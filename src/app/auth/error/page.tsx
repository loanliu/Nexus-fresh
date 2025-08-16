'use client';

import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to your Google account.';
      case 'no_code':
        return 'No authorization code received from Google.';
      case 'no_access_token':
        return 'Failed to obtain access token from Google.';
      case 'callback_failed':
        return 'Authentication callback failed.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Failed
        </h1>
        <p className="text-gray-600 mb-4">
          {getErrorMessage(error)}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = '/api/auth/google'}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          If the problem persists, please check your Google Cloud Console configuration.
        </p>
      </div>
    </div>
  );
}
