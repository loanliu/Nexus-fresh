'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface GoogleDocument {
  id: string;
  name: string;
  mimeType: string;
  description?: string;
  webViewLink?: string;
  folderPath?: string;
  createdTime: string;
  modifiedTime: string;
}

export interface PaginationInfo {
  nextPageToken?: string;
  hasMore: boolean;
  totalLoaded: number;
  currentPage: number;
}

export function useGoogleDocs() {
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasMore: false,
    totalLoaded: 0,
    currentPage: 1
  });
  const [isClient, setIsClient] = useState(false);

  const pageSize = 20;

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadDocuments = useCallback(async (query?: string, pageToken?: string) => {
    if (!isClient) return; // Don't make API calls during SSR
    
    try {
      if (!pageToken) {
        setLoading(true);
        setDocuments([]);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        ...(pageToken && { pageToken }),
        ...(query && { q: query })
      });
      
      console.log('API call params:', Object.fromEntries(params));

      // Get the current user ID for authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required - please sign in');
      }

      const response = await fetch(`/api/drive/docs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required - Please sign in with Google to access your Drive documents');
        } else if (response.status === 403) {
          throw new Error('Access denied - Please check your Google Drive permissions');
        } else {
          throw new Error(data.error || `Failed to load documents (${response.status})`);
        }
      }

      if (pageToken) {
        // Append to existing documents
        setDocuments(prev => [...prev, ...data.documents]);
        setPagination(prev => ({
          nextPageToken: data.nextPageToken,
          hasMore: !!data.nextPageToken,
          totalLoaded: prev.totalLoaded + data.documents.length,
          currentPage: prev.currentPage + 1
        }));
      } else {
        // Replace documents
        setDocuments(data.documents);
        setPagination({
          nextPageToken: data.nextPageToken,
          hasMore: !!data.nextPageToken,
          totalLoaded: data.documents.length,
          currentPage: 1
        });
      }

    } catch (err) {
      console.error('Error loading documents:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      
      // If it's an authentication error, provide a helpful message
      if (errorMessage.includes('Authentication required')) {
        setError('Authentication required - Please sign in with Google to access your Drive documents. Click the "Sign in with Google" button below.');
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [isClient]);

  const loadMoreDocuments = () => {
    if (!isClient) return; // Don't execute during SSR
    if (pagination.nextPageToken && !isLoadingMore) {
      loadDocuments(undefined, pagination.nextPageToken);
    }
  };

  const searchDocuments = useCallback(async (query: string) => {
    if (!isClient) return; // Don't execute during SSR
    console.log('Searching for:', query);
    setSearchQuery(query);
    await loadDocuments(query);
  }, [loadDocuments, isClient]);

  // Load initial documents only on client
  useEffect(() => {
    if (isClient) {
      loadDocuments();
    }
  }, [loadDocuments, isClient]);

  return {
    documents,
    filteredDocuments: documents, // For now, filtered documents are the same as documents
    isLoading: loading,
    isLoadingMore,
    error,
    searchQuery,
    setSearchQuery,
    pagination,
    loadDocuments,
    loadMoreDocuments,
    searchDocuments,
    refreshDocuments: () => loadDocuments(),
    refetch: () => loadDocuments()
  };
}