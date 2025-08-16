'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleDocs, GoogleDocument } from '@/hooks/use-google-docs';
import { SearchFilters } from './search-filters';

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

  const handleFiltersChange = (filters: any) => {
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
    <>
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
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Left Content - Takes available space */}
                <div className="flex-1 min-w-0 pr-6">
                  {/* Document Title */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {doc.name}
                  </h3>
                  
                  {/* Folder Path */}
                  {doc.folderPath && (
                    <div className="text-sm text-blue-600 font-medium mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      {doc.folderPath}
                    </div>
                  )}
                  
                  {/* Description */}
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {doc.content}
                  </p>
                  
                  {/* Document Details */}
                  <div className="flex flex-wrap gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {doc.mimeType.includes('document') ? 'Document' : 
                       doc.mimeType.includes('spreadsheet') ? 'Spreadsheet' : 'Presentation'}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(doc.createdTime).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {doc.size}
                    </span>
                    <span>Size: {doc.size}</span>
   {doc.folderPath && (
     <span className="text-blue-600 font-medium flex items-center gap-1">
       📁 {doc.folderPath}
     </span>
   )}
                  </div>
                </div>
                
                {/* Right Button - Never shrinks, stays aligned */}
                <div className="flex-shrink-0">
                  <a
                    href={doc.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
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
    </>
  );
}