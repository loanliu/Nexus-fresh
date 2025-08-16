'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleDocs, GoogleDocument } from '@/hooks/use-google-docs';

import { SearchFilters, SearchFilters as SearchFiltersType } from './search-filters';

export default function GoogleResources() {
  const {
    documents,
    filteredDocuments,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    loadDocuments,
    searchDocuments,
    refreshDocuments,
  } = useGoogleDocs();

  const [isSearching, setIsSearching] = useState(false);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        searchDocuments(searchQuery, true).finally(() => setIsSearching(false));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchDocuments]);



  const handleFiltersChange = (filters: SearchFiltersType) => {
    // Update search query when filters change
    setSearchQuery(filters.query);
    
    // TODO: Implement advanced filtering based on file types, date range, and sorting
    // This would require updating the API to handle these filters
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    // TODO: Reset all filters to defaults
  };

  const handleRefresh = async () => {
    await refreshDocuments();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Resources
        </h1>
        <p className="text-gray-600">
          Search and manage your Google Drive documents, excluding videos, audio, and files created before 2020.
        </p>
      </div>

      {/* Search Filters */}
      <SearchFilters 
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Actions */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Documents
        </Button>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} documents
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {isSearching ? 'Searching documents...' : 'Loading documents...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          {error.includes('Authentication required') || error.includes('authRequired') ? (
            <div className="mt-3">
              <p className="text-sm text-red-700 mb-2">
                You need to authenticate with Google to access your Drive documents.
              </p>
              <Button
                onClick={() => window.location.href = '/api/auth/google'}
                className="mt-2"
              >
                Sign in with Google
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Documents List */}
      {!isLoading && !error && !isSearching && (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {doc.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {doc.content || 'No description available'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Type: {doc.mimeType.includes('document') ? 'Document' : doc.mimeType.includes('spreadsheet') ? 'Spreadsheet' : 'Presentation'}</span>
                    <span>Created: {new Date(doc.createdTime).toLocaleDateString()}</span>
                    <span>Size: {doc.size} bytes</span>
                    {doc.folderPath && (
     <span className="text-blue-600 font-medium flex items-center gap-1">
       📁 {doc.folderPath}
     </span>
   )}                    
                  </div>
                </div>
                <div className="ml-4">
                  <a
                    href={doc.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    Open Document
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !isSearching && filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try adjusting your search terms.' : 'No documents available.'}
          </p>
        </div>
      )}


    </div>
  );
}

