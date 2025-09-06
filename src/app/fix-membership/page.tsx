'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixMembershipPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const addMembership = async () => {
    setLoading(true);
    setResult('Adding membership...');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setResult('Error: Not authenticated');
        return;
      }

      const userId = user.id;
      const projectId = '7d744fa7-d228-466e-87b0-27d19ac7c844';

      console.log('Adding membership for user:', userId, 'project:', projectId);

      // First, delete any existing memberships
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (deleteError) {
        console.log('Delete error (might not exist):', deleteError.message);
      }

      // Add new membership (use 'admin' instead of 'super_admin' due to database constraints)
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: 'admin' // Use 'admin' instead of 'super_admin' for now
        })
        .select()
        .single();

      if (error) {
        setResult(`Error: ${error.message}`);
        console.error('Insert error:', error);
      } else {
        setResult(`Success! Added membership: ${JSON.stringify(data, null, 2)}`);
        console.log('Success:', data);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMembership = async () => {
    setLoading(true);
    setResult('Checking membership...');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setResult('Error: Not authenticated');
        return;
      }

      const userId = user.id;
      const projectId = '7d744fa7-d228-466e-87b0-27d19ac7c844';

      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        setResult(`Error: ${error.message}`);
      } else {
        setResult(`Current memberships: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Fix Project Membership</h1>
        
        <div className="space-y-4">
          <button
            onClick={checkMembership}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Current Membership'}
          </button>
          
          <button
            onClick={addMembership}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Super Admin Membership'}
          </button>
        </div>
        
        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
