export interface SearchResult {
  entity_id: string;
  title: string;
  snippet?: string;
  source: 'resource' | 'category' | 'subcategory' | 'tag' | 'task' | 'file' | 'project' | 'api-key';
  similarity: number;
  updated_at: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  timestamp: string;
  filters?: SearchFilters;
}

export interface SearchFilters {
  sources: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  categories?: string[];
  tags?: string[];
  status?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  page?: number;
  limit?: number;
}
