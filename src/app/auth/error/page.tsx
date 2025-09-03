'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  const getErrorMessage = () => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. Please try again.';
      case 'session_exchange_failed':
        return 'Failed to complete authentication. Please try again.';
      case 'no_session':
        return 'No session was created. Please try signing in again.';
      case 'callback_error':
        return 'An error occurred during authentication.';
      default:
        return description || 'An authentication error occurred.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorMessage()}
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">
              Error Code: {error || 'Unknown'}
            </p>
            {description && (
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Details: {description}
              </p>
            )}
          </div>
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Try Again
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}