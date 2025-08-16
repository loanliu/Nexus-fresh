'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AuthSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Don't call router.push here - just return 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Remove router dependency

  // Add a separate useEffect to handle the redirect
  useEffect(() => {
    if (countdown === 0) {
      router.push('/');
    }
  }, [countdown, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          You have successfully signed in with Google. You can now access your Google Drive documents.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Go to Dashboard
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
          Redirecting automatically in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
