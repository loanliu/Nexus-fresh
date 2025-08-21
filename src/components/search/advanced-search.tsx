'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, X, FileText, Folder, Tag, CheckSquare, File, ChevronLeft, ChevronRight, Clock, TrendingUp, Bookmark, Keyboard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchResult, SearchResponse, SearchFilters } from '@/types/search';
import { supabase } from '@/lib/supabase';

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  resource: FileText,
  category: Folder,
  subcategory: Folder,
  tag: Tag,
  task: CheckSquare,
  file: File,
};

const SOURCE_LABELS: Record<string, string> = {
  resource: 'Resources',
  category: 'Categories',
  subcategory: 'Subcategories',
  tag: 'Tags',
  task: 'Tasks',
  file: 'Google Drive',
  'api-key': 'API Keys',
};

// Search suggestions based on common patterns
const SEARCH_SUGGESTIONS = [
  'project management',
  'client onboarding',
  'checklist template',
  'API documentation',
  'file organization',
  'task tracking',
  'category structure',
  'tag system',
  'Google Docs',
  'spreadsheet',
  'presentation',
  'PDF files'
];

interface AdvancedSearchProps {
  onTabChange?: (tab: string) => void;
}

export function AdvancedSearch({ onTabChange }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sources: ['resource', 'category', 'subcategory', 'tag', 'task', 'file', 'api-key']
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    averageResults: 0,
    lastSearchTime: 0
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
    
    // Load search stats
    const stats = localStorage.getItem('search-stats');
    if (stats) {
      try {
        setSearchStats(JSON.parse(stats));
      } catch (e) {
        console.warn('Failed to parse search stats');
      }
    }
  }, []);

  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const trimmed = searchQuery.trim();
    setRecentSearches(prev => {
      const newSearches = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 10);
      localStorage.setItem('recent-searches', JSON.stringify(newSearches));
      return newSearches;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  }, []);

  const clearSearchStats = useCallback(() => {
    setSearchStats({
      totalSearches: 0,
      averageResults: 0,
      lastSearchTime: 0
    });
    localStorage.removeItem('search-stats');
  }, []);

  const updateSearchStats = useCallback((resultsCount: number, searchTime: number) => {
    setSearchStats(prev => {
      const newStats = {
        totalSearches: prev.totalSearches + 1,
        averageResults: Math.round((prev.averageResults * prev.totalSearches + resultsCount) / (prev.totalSearches + 1)),
        lastSearchTime: searchTime
      };
      localStorage.setItem('search-stats', JSON.stringify(newStats));
      return newStats;
    });
  }, []);

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      // Search across multiple tables using Supabase client
      let allResults: SearchResult[] = [];

      // Search in resources table
      if (!filters?.sources || filters.sources.includes('resource')) {
        const { data: resources, error: resourceError } = await supabase
          .from('resources')
          .select(`
            id,
            title,
            description,
            file_url,
            created_at,
            category_id,
            subcategory_id
          `)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (resourceError) {
          console.error('Resource search error:', resourceError);
        } else if (resources) {
          const resourceResults: SearchResult[] = resources.map(resource => ({
            entity_id: resource.id,
            title: resource.title || 'Untitled Resource',
            snippet: resource.description || '',
            source: 'resource' as const,
            similarity: 0.8,
            updated_at: resource.created_at,
            url: resource.file_url,
            metadata: {
              category_id: resource.category_id,
              subcategory_id: resource.subcategory_id
            }
          }));
          allResults.push(...resourceResults);
        }
      }

      // Search in categories table
      if (!filters?.sources || filters.sources.includes('category')) {
        const { data: categories, error: categoryError } = await supabase
          .from('categories')
          .select('id, name, description, created_at')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (categoryError) {
          console.error('Category search error:', categoryError);
        } else if (categories) {
          const categoryResults: SearchResult[] = categories.map(category => ({
            entity_id: category.id,
            title: category.name,
            snippet: category.description || '',
            source: 'category' as const,
            similarity: 0.9,
            updated_at: category.created_at,
            metadata: {}
          }));
          allResults.push(...categoryResults);
        }
      }

      // Search in subcategories table
      if (!filters?.sources || filters.sources.includes('subcategory')) {
        const { data: subcategories, error: subcategoryError } = await supabase
          .from('subcategories')
          .select('id, name, description, created_at, category_id')
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (subcategoryError) {
          console.error('Subcategory search error:', subcategoryError);
        } else if (subcategories) {
          const subcategoryResults: SearchResult[] = subcategories.map(subcategory => ({
            entity_id: subcategory.id,
            title: subcategory.name,
            snippet: subcategory.description || '',
            source: 'subcategory' as const,
            similarity: 0.85,
            updated_at: subcategory.created_at,
            metadata: {
              category_id: subcategory.category_id
            }
          }));
          allResults.push(...subcategoryResults);
        }
      }

      // Search in API keys table
      if (!filters?.sources || filters.sources.includes('api-key')) {
        const { data: apiKeys, error: apiKeyError } = await supabase
          .from('api_keys')
          .select('id, service_name, key_name, notes, created_at')
          .or(`service_name.ilike.%${searchQuery}%,key_name.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (apiKeyError) {
          console.error('API key search error:', apiKeyError);
        } else if (apiKeys) {
          const apiKeyResults: SearchResult[] = apiKeys.map(apiKey => ({
            entity_id: apiKey.id,
            title: `${apiKey.service_name} - ${apiKey.key_name}`,
            snippet: apiKey.notes || '',
            source: 'api-key' as const,
            similarity: 0.75,
            updated_at: apiKey.created_at,
            metadata: {
              service: apiKey.service_name,
              keyName: apiKey.key_name
            }
          }));
          allResults.push(...apiKeyResults);
        }
      }

      // Search in Google Drive documents
      if (!filters?.sources || filters.sources.includes('file')) {
        try {
          console.log('🔍 Searching Google Drive for:', searchQuery);
          const response = await fetch(`/api/drive/docs?pageSize=50&q=${encodeURIComponent(searchQuery)}`);
          console.log('📡 Google Drive API response status:', response.status);
          
          if (response.ok) {
            const driveData = await response.json();
            console.log('📁 Google Drive data received:', {
              hasFiles: !!driveData.documents,
              fileCount: driveData.documents?.length || 0,
              firstFile: driveData.documents?.[0],
              fullResponse: driveData,
              responseKeys: Object.keys(driveData)
            });
            
            if (driveData.documents && driveData.documents.length > 0) {
              const driveResults: SearchResult[] = driveData.documents
                .map((file: any) => ({
                  entity_id: file.id,
                  title: file.name,
                  snippet: file.description || `Google Drive ${file.mimeType?.includes('document') ? 'Document' : file.mimeType?.includes('spreadsheet') ? 'Spreadsheet' : 'Presentation'}`,
                  source: 'file' as const,
                  similarity: 0.8, // Higher similarity since these are pre-filtered by the API
                  updated_at: file.modifiedTime || file.createdTime,
                  url: file.webViewLink,
                  metadata: {
                    mimeType: file.mimeType,
                    size: file.size,
                    folder: file.folderPath || 'Root'
                  }
                }));
              
              console.log('✅ Google Drive results found:', driveResults.length);
              allResults.push(...driveResults);
            } else {
              console.log('📭 No Google Drive documents found for search query');
            }
          } else {
            console.error('❌ Google Drive API error:', response.status, response.statusText);
            // If it's an authentication error, provide helpful info
            if (response.status === 401) {
              console.log('🔐 Google Drive requires authentication. User needs to sign in with Google.');
            }
          }
        } catch (driveError) {
          console.error('❌ Google Drive search error:', driveError);
        }
      }

      // Sort results by similarity and recency
      allResults.sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      // Limit total results
      const searchResults = allResults.slice(0, 20);
      
      console.log('🔍 Final search results:', {
        totalFound: allResults.length,
        finalResults: searchResults.length,
        bySource: searchResults.reduce((acc, result) => {
          acc[result.source] = (acc[result.source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      const response: SearchResponse = {
        query: searchQuery,
        results: searchResults,
        total: searchResults.length,
        page: 1,
        limit: 20,
        timestamp: new Date().toISOString(),
        filters
      };

      setResults(response);
      setCurrentPage(page);
      saveRecentSearch(searchQuery);
      
      // Update search stats
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      const totalResults = response.total;
      updateSearchStats(totalResults, searchTime);

      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [filters, saveRecentSearch, updateSearchStats]);

  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 3) {
      performSearch(debouncedQuery, 1);
    } else {
      setResults(null);
    }
  }, [debouncedQuery, performSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setQuery('');
        setResults(null);
      }
      
      // Enter to search if not already searching
      if (e.key === 'Enter' && document.activeElement === searchInputRef.current && !loading) {
        performSearch(query.trim(), 1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, loading, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && query.trim().length >= 3) {
      performSearch(query.trim(), 1);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (query.trim()) {
      performSearch(query.trim(), newPage);
    }
  };

  const toggleSourceFilter = (source: string) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion, 1);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery, 1);
  };

  const handleViewResult = (result: SearchResult) => {
    if (!onTabChange) return;
    
    // Navigate to the appropriate tab based on the result source
    switch (result.source) {
      case 'category':
        onTabChange('categories');
        break;
      case 'resource':
        onTabChange('resources');
        break;
      case 'task':
        onTabChange('tasks');
        break;
      case 'project':
        onTabChange('projects');
        break;
      case 'api-key':
        onTabChange('api-keys');
        break;
      default:
        onTabChange('resources');
    }
    
    // You could also store the selected item ID to highlight it in the target tab
    // For now, just navigate to the appropriate tab
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSearchTime = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${Math.round(milliseconds)}ms`;
    }
    return `${(milliseconds / 1000).toFixed(2)}s`;
  };

  // Helper function to get source count (not needed with new structure)

  const totalResults = results?.total || results?.results?.length || 0;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Advanced Search
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="flex items-center space-x-2"
            >
              <Keyboard className="h-4 w-4" />
              <span>Shortcuts</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Suggestions</span>
            </Button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search across all content... (Ctrl+K to focus)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
              disabled={loading}
              onFocus={() => setShowSuggestions(true)}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Keyboard Shortcuts */}
          {showKeyboardShortcuts && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 flex items-center">
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border text-xs font-mono">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
                  </kbd>
                  <span className="text-blue-800 dark:text-blue-200">Focus search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border text-xs font-mono">
                    Enter
                  </kbd>
                  <span className="text-blue-800 dark:text-blue-200">Perform search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border text-xs font-mono">
                    Esc
                  </kbd>
                  <span className="text-blue-800 dark:text-blue-200">Clear search</span>
                </div>
                <div className="flex items-center space-x-2">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border text-xs font-mono">
                    /
                  </kbd>
                  <span className="text-blue-800 dark:text-blue-200">Quick search</span>
                </div>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Search Suggestions
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="outline"
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
              
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-2" />
                      Recent Searches
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((recentQuery) => (
                      <Badge
                        key={recentQuery}
                        variant="secondary"
                        className="cursor-pointer hover:opacity-80"
                        onClick={() => handleRecentSearchClick(recentQuery)}
                      >
                        {recentQuery}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Content Types</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SOURCE_LABELS).map(([source, label]) => (
                  <Badge
                    key={source}
                    variant={filters.sources.includes(source) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleSourceFilter(source)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !query.trim() || query.trim().length < 3}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search
              </>
            )}
          </Button>
          
          {query.trim().length > 0 && query.trim().length < 3 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Enter at least 3 characters to search
            </p>
          )}
        </form>

        {/* Search Stats */}
        {results && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{results.query}"
              </span>
              <div className="flex items-center space-x-4">
                <span>Search time: {formatSearchTime(searchStats.lastSearchTime)}</span>
                {results.timestamp && <span>{formatDate(results.timestamp)}</span>}
              </div>
            </div>
          </div>
        )}

        {/* Overall Search Statistics */}
        {searchStats.totalSearches > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Total searches: {searchStats.totalSearches}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Avg results: {searchStats.averageResults}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearchStats}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                Clear Stats
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {results && (
        <div className="space-y-6">
          {/* Results List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Search Results
                </h3>
                <Badge variant="secondary">
                  {results.results.length} result{results.results.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.results.map((result) => (
                <div key={result.entity_id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        <button 
                          onClick={() => handleViewResult(result)}
                          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left w-full"
                        >
                          {highlightText(result.title, results.query)}
                        </button>
                      </h4>
                      
                      {result.snippet && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {highlightText(result.snippet, results.query)}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Source: {result.source}</span>
                        <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
                        <span>Updated: {formatDate(result.updated_at)}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResult(result)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {totalResults > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-center">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{results.query}"
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {results && totalResults === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No results found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters to find what you're looking for.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!results && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Start searching
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter a search query above to find resources, categories, tasks, and more across your workspace.
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>💡 Tip: Use Ctrl+K to quickly focus the search box</p>
          </div>
        </div>
      )}
    </div>
  );
}
