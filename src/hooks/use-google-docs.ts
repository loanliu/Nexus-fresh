import { useState, useEffect, useCallback } from 'react';

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

interface UseGoogleDocsReturn {
  documents: GoogleDocument[];
  filteredDocuments: GoogleDocument[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadDocuments: () => Promise<void>;
  searchDocuments: (query: string, includeContent?: boolean) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export function useGoogleDocs(): UseGoogleDocsReturn {
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<GoogleDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/drive/docs');
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        setFilteredDocuments(data.documents);
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
  }, []);

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

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    documents,
    filteredDocuments,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    loadDocuments,
    searchDocuments,
    refreshDocuments,
  };
}
