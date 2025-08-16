import { useState, useEffect, useCallback, useRef } from 'react';

export interface GoogleDocument {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
  webViewLink: string;
  folderPath?: string;  // Add this line
  content?: string;
}

interface PaginationInfo {
  hasMore: boolean;
  nextPageToken: string | null;
  pageSize: number;
  currentPage: number;
  totalLoaded: number;
}

interface UseGoogleDocsReturn {
  documents: GoogleDocument[];
  filteredDocuments: GoogleDocument[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchQuery: string;
  pagination: PaginationInfo;
  setSearchQuery: (query: string) => void;
  loadDocuments: (reset?: boolean) => Promise<void>;
  loadMoreDocuments: () => Promise<void>;
  searchDocuments: (query: string, includeContent?: boolean) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export function useGoogleDocs(): UseGoogleDocsReturn {
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GoogleDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    hasMore: false,
    nextPageToken: null,
    pageSize: 20,
    currentPage: 0,
    totalLoaded: 0
  });

  // Load documents with pagination support
  const loadDocuments = useCallback(async (reset = true, customPageToken?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const url = new URL('/api/drive/docs', window.location.origin);
      url.searchParams.set('pageSize', '20'); // Fixed page size to 20
      
      if (!reset && customPageToken) {
        url.searchParams.set('pageToken', customPageToken);
      }
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        if (reset) {
          setDocuments(data.documents);
          setFilteredDocuments(data.documents);
          setPagination(prev => ({
            ...prev,
            hasMore: data.hasMore || false,
            nextPageToken: data.nextPageToken || null,
            currentPage: 1,
            totalLoaded: data.documents.length
          }));
        } else {
          // Append new documents for "Load More"
          setDocuments(prev => [...prev, ...data.documents]);
          setFilteredDocuments(prev => [...prev, ...data.documents]);
          setPagination(prev => ({
            ...prev,
            hasMore: data.hasMore || false,
            nextPageToken: data.nextPageToken || null,
            currentPage: prev.currentPage + 1,
            totalLoaded: prev.totalLoaded + data.documents.length
          }));
        }
      } else {
        throw new Error(data.error || 'Failed to load documents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies to prevent infinite loop

  // Load more documents (append to existing)
  const loadMoreDocuments = () => {
    if (isLoadingMore || !pagination.hasMore || !pagination.nextPageToken) {
      return;
    }
    
    const currentPageToken = pagination.nextPageToken;
    loadDocuments(false, currentPageToken);
  };

  // Search documents with optional content
  const searchDocuments = useCallback(async (query: string, includeContent = false) => {
    if (!query.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drive/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          includeContent
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFilteredDocuments(data.documents);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  // Refresh documents
  const refreshDocuments = useCallback(async () => {
    await loadDocuments();
  }, [loadDocuments]);

  // Filter documents based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    // Local filtering for better performance
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredDocuments(filtered);
  }, [searchQuery, documents]);

  // Load documents on mount - only run once
  useEffect(() => {
    loadDocuments(true);
  }, []); // Empty dependency array to run only once on mount

  return {
    documents,
    filteredDocuments,
    isLoading,
    isLoadingMore,
    error,
    searchQuery,
    pagination,
    setSearchQuery,
    loadDocuments,
    loadMoreDocuments,
    searchDocuments,
    refreshDocuments,
  };
}
