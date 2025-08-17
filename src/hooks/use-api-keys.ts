'use client';

import { useState, useEffect } from 'react';
import { ApiKey } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch API keys
  const fetchApiKeys = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApiKeys(data || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  // Add new API key
  const addApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          ...apiKeyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setApiKeys(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to add API key');
      return null;
    }
  };

  // Update API key
  const updateApiKey = async (apiKeyId: string, updates: Partial<ApiKey>) => {
    if (!user) return null;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('api_keys')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', apiKeyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setApiKeys(prev => 
        prev.map(apiKey => 
          apiKey.id === apiKeyId ? { ...apiKey, ...data } : apiKey
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to update API key');
      return null;
    }
  };

  // Delete API key
  const deleteApiKey = async (apiKeyId: string) => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', apiKeyId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setApiKeys(prev => prev.filter(apiKey => apiKey.id !== apiKeyId));
      return true;
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
      return false;
    }
  };

  // Initialize
  useEffect(() => {
    if (!user) {
      setApiKeys([]);
      setLoading(false);
      return;
    }

    fetchApiKeys();
  }, [user]);

  return {
    apiKeys,
    loading,
    error,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    refetch: fetchApiKeys,
  };
}
