'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleDocs, GoogleDocument } from '@/hooks/use-google-docs';
import { SearchFilters } from './search-filters';
import GoogleDriveAuth from './google-drive-auth';
import { supabase } from '@/lib/supabaseClient';

export default function GoogleResources() {
  const [isClient, setIsClient] = useState(false);
  const {
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
  } = useGoogleDocs();

  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle search with debouncing
  useEffect(() => {
    if (!isClient) return; // Don't run effects until client-side
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        searchDocuments(searchQuery).finally(() => setIsSearching(false));
      } else if (searchQuery === '') {
        // Clear search and load all documents
        setIsSearching(true);
        loadDocuments().finally(() => setIsSearching(false));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchDocuments, loadDocuments, isClient]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user?.email) {
        try {
          // First try to find tokens by user_id (preferred method)
          let { data } = await supabase
            .from('google_access_tokens')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          // If no tokens found by user_id, try by user_email (legacy method)
          if (!data) {
            const { data: emailData } = await supabase
              .from('google_access_tokens')
              .select('id')
              .eq('user_email', user.email)
              .maybeSingle();
            data = emailData;
          }
          
          setIsConnected(!!data);
        } finally {
          setChecking(false);
        }
      } else {
        setChecking(false);
      }
    };
    init();
  }, []);

  // Don't render anything until client-side to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Google Resources
        </h1>
        <p className="text-gray-600">
          Search and manage your Google Drive documents, excluding videos, audio, and files created before 2020.
        </p>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything until we've checked the connection status
  if (!user || checking) return null;

  const handleFiltersChange = (filters: any) => {
    // Update search query when filters change
    setSearchQuery(filters.query);
    
    // TODO: Implement advanced filtering based on file types, date range, and sorting
    // This would require updating the API to handle these filters
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setIsSearching(true);
    loadDocuments().finally(() => setIsSearching(false));
  };

  const handleRefresh = async () => {
    await refreshDocuments();
  };

  const handleConnectGoogleDrive = async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      // Use the same OAuth flow as the main Google authentication
      // This will reuse the existing Google session if available
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            include_granted_scopes: 'true',
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      alert(`Failed to connect to Google: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
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
      
      {/* Google Drive Connection Section - Show when not connected */}
      {!isConnected && (
        <div className="mb-6">
          <GoogleDriveAuth />
        </div>
      )}      

      {/* Show disconnect button when connected */}
      {isConnected && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-green-800">✅ Google Drive Connected</h3>
              <p className="text-xs text-green-700 mt-1">
                You're successfully connected to Google Drive. Your documents should appear below.
              </p>
            </div>
            <Button
              onClick={async () => {
                if (!user) return;
                try {
                  // Clear Google access tokens from database
                  await supabase
                    .from('google_access_tokens')
                    .delete()
                    .eq('user_email', user.email);
                  
                  // Update local state
                  setIsConnected(false);
                  
                  alert('Google Drive disconnected successfully! Please refresh the page.');
                } catch (error) {
                  console.error('Error disconnecting:', error);
                  alert('Failed to disconnect. Please try again.');
                }
              }}
              className="text-red-600 border-red-300 hover:bg-red-50 border"
            >
              🔓 Disconnect Google Drive
            </Button>
          </div>
        </div>
      )}

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
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredDocuments?.length || 0} documents{pagination.hasMore && ' (more available)'}
          {searchQuery && searchQuery.trim() && ` for "${searchQuery}"`}
        </p>
        {pagination.totalLoaded > 0 && (
          <p className="text-xs text-gray-500">
            Loaded {pagination.totalLoaded} documents • Page {pagination.currentPage}
          </p>
        )}
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
          {error.includes('Authentication required') || error.includes('authRequired') || error.includes('Google access token not found') ? (
            <div className="mt-3">
              <p className="text-sm text-red-700 mb-2">
                You need to authorize Google Drive access to view your documents.
              </p>
              <GoogleDriveAuth />
            </div>
          ) : (
            <Button
              onClick={handleRefresh}

              className="mt-2"
            >
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* Documents List */}
      {!isLoading && !error && !isSearching && filteredDocuments && filteredDocuments.length > 0 && (
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
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       Updated: {new Date(doc.modifiedTime).toLocaleDateString()} {new Date(doc.modifiedTime).toLocaleTimeString()}
                     </span>
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

      {/* Load More Button */}
      {!isLoading && !isSearching && !error && filteredDocuments && filteredDocuments.length > 0 && pagination.hasMore && (
        <div className="mt-8 text-center">
          <Button
            onClick={loadMoreDocuments}
            disabled={isLoadingMore}
            className="px-8 py-3"
            
          >
            {isLoadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading More...
              </>
            ) : (
              <>
                Load More Documents
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Click to load more documents from your Google Drive
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && !isSearching && (!filteredDocuments || filteredDocuments.length === 0) && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents found
          </h3>
          <p className="text-gray-600">
            {searchQuery && searchQuery.trim() ? 'Try adjusting your search terms.' : 'No documents available.'}
          </p>
        </div>
      )}
    </>
  );
}