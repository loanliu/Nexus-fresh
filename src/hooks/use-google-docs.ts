'use client';

import { useState, useEffect, useCallback } from 'react';

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

  const pageSize = 20;

  const loadDocuments = useCallback(async (query?: string, pageToken?: string) => {
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

      const response = await fetch(`/api/drive/docs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
  }, []);

  const loadMoreDocuments = () => {
    if (pagination.nextPageToken && !isLoadingMore) {
      loadDocuments(undefined, pagination.nextPageToken);
    }
  };

  const searchDocuments = useCallback(async (query: string) => {
    console.log('Searching for:', query);
    setSearchQuery(query);
    await loadDocuments(query);
  }, [loadDocuments]);

  // Load initial documents
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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