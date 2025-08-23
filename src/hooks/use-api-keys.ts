'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiKey } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { SimpleEncryption } from '@/lib/simple-encryption';

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch API keys
  const fetchApiKeys = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('key_name', { ascending: true });

      if (fetchError) throw fetchError;

      // Decrypt API keys using simple encryption
      const decryptedApiKeys = (data || []).map((apiKey) => {
        try {
          const decryptedKey = SimpleEncryption.decrypt(apiKey.encrypted_key);
          return {
            ...apiKey,
            encrypted_key: decryptedKey
          };
        } catch (err) {
          console.error('Failed to decrypt API key:', err);
          return {
            ...apiKey,
            encrypted_key: '[ENCRYPTED]'
          };
        }
      });

      setApiKeys(decryptedApiKeys);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new API key
  const addApiKey = useCallback(async (apiKeyData: Omit<ApiKey, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      setError(null);

      // Clean up empty strings to prevent database errors, but preserve the API key
      const { encrypted_key: plaintextKey, ...otherData } = apiKeyData;
      const cleanedApiKeyData = Object.fromEntries(
        Object.entries(otherData).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );

      // Encrypt the API key using simple encryption
      const encryptedKey = plaintextKey ? SimpleEncryption.encrypt(plaintextKey) : '';

      const { data, error: insertError } = await supabase
        .from('api_keys')
        .insert({
          ...cleanedApiKeyData,
          encrypted_key: encryptedKey,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state for display
      const displayApiKey = {
        ...data,
        encrypted_key: plaintextKey // Show original key for display
      };

      setApiKeys(prev => {
        const newKeys = [displayApiKey, ...prev];
        // Sort by key_name alphabetically
        return newKeys.sort((a, b) => (a.key_name || '').localeCompare(b.key_name || ''));
      });
      return displayApiKey;
    } catch (err) {
      console.error('Error adding API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to add API key');
      return null;
    }
  }, [user]);

  // Update API key
  const updateApiKey = useCallback(async (apiKeyId: string, updates: Partial<ApiKey>) => {
    if (!user) return null;

    try {
      setError(null);

      // Remove fields that shouldn't be updated
      const { id, created_at, user_id, ...updateData } = updates;
      
      // Clean up empty strings to prevent database errors
      const cleanedUpdateData = Object.fromEntries(
        Object.entries(updateData).map(([key, value]) => [
          key, 
          value === '' ? null : value
        ])
      );
      
      // If the API key is being updated, encrypt it
      if (cleanedUpdateData.encrypted_key && typeof cleanedUpdateData.encrypted_key === 'string') {
        cleanedUpdateData.encrypted_key = SimpleEncryption.encrypt(cleanedUpdateData.encrypted_key);
      }
      
      console.log('Updating API key:', {
        apiKeyId,
        userId: user.id,
        updateData: cleanedUpdateData,
        fullUpdates: updates
      });

      const { data, error: updateError } = await supabase
        .from('api_keys')
        .update({
          ...cleanedUpdateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', apiKeyId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }

      // Update local state
      const updatedApiKey = {
        ...data,
        encrypted_key: updates.encrypted_key || data.encrypted_key
      };

      setApiKeys(prev => 
        prev.map(apiKey => 
          apiKey.id === apiKeyId ? updatedApiKey : apiKey
        )
      );

      return updatedApiKey;
    } catch (err) {
      console.error('Error updating API key:', err);
      setError(err instanceof Error ? err.message : 'Failed to update API key');
      return null;
    }
  }, [user]);

  // Delete API key
  const deleteApiKey = useCallback(async (apiKeyId: string) => {
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
      return null;
    }
  }, [user]);

  // Initialize - fetch keys once when user is available
  useEffect(() => {
    if (user) {
      fetchApiKeys();
    } else {
      setApiKeys([]);
      setLoading(false);
    }
  }, [user, fetchApiKeys]);

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
