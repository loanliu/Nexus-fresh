'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'no_code':
        return 'No authorization code received from Google.';
      case 'no_access_token':
        return 'Failed to get access token from Google.';
      case 'signin_failed':
        return 'Failed to sign in with existing account.';
      case 'signup_failed':
        return 'Failed to create new account.';
      case 'callback_failed':
        return 'Authentication callback failed.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Authentication Error
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {getErrorMessage(error)}
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Try Again
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          If this problem persists, please check your internet connection and try again.
        </p>
      </div>
    </div>
  );
}
