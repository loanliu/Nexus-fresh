'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestAuthPage() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testAuth = async () => {
    setIsLoading(true);
    setResult('Testing authentication...');
    
    try {
      // Test the invites API
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: '7d744fa7-d228-466e-87b0-27d19ac7c844',
          email: 'test@example.com',
          role: 'viewer'
        })
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async () => {
    setIsLoading(true);
    setResult('Checking session...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setResult(`Session error: ${error.message}`);
      } else if (session) {
        setResult(`Session found! User: ${session.user?.email || 'Unknown'}\nUser ID: ${session.user?.id}\nAccess Token: ${session.access_token?.substring(0, 20)}...`);
      } else {
        setResult('No session found. Please log in.');
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Authentication</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkSession}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Check Session
        </button>
        
        <button
          onClick={testAuth}
          disabled={isLoading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Invites API
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {result}
        </pre>
      </div>
    </div>
  );
}
