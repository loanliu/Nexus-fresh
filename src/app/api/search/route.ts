import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SearchRequest, SearchResponse, SearchResult } from '@/types/search';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication with better error logging
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Search API - Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError) {
      console.error('Search API - Auth error:', authError);
      return NextResponse.json({ error: `Authentication error: ${authError.message}` }, { status: 401 });
    }
    
    if (!user) {
      console.error('Search API - No user found');
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    const body: SearchRequest = await request.json();
    const { query, filters, page = 1, limit = 20 } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const searchQuery = query.trim();
    const offset = (page - 1) * limit;
    const timestamp = new Date().toISOString();

    // Build search query using PostgreSQL full-text search
    let searchResults: SearchResult[] = [];
    let totalCount = 0;

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
        .eq('user_id', user.id)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

              if (!resourceError && resources) {
          const resourceResults: SearchResult[] = resources.map(resource => ({
            entity_id: resource.id,
            title: resource.title || 'Untitled Resource',
            snippet: resource.description || '',
            source: 'resource' as const,
            similarity: 0.8, // Placeholder similarity score
            updated_at: resource.created_at,
            url: resource.file_url,
                      metadata: {
            category_id: resource.category_id,
            subcategory_id: resource.subcategory_id
          }
          }));
          searchResults.push(...resourceResults);
        }
    }

    // Search in categories table
    if (!filters?.sources || filters.sources.includes('category')) {
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, description, created_at')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('user_id', user.id)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (!categoryError && categories) {
        const categoryResults: SearchResult[] = categories.map(category => ({
          entity_id: category.id,
          title: category.name,
          snippet: category.description || '',
          source: 'category' as const,
          similarity: 0.9, // Placeholder similarity score
          updated_at: category.created_at,
          metadata: {}
        }));
        searchResults.push(...categoryResults);
      }
    }

    // Search in subcategories table
    if (!filters?.sources || filters.sources.includes('subcategory')) {
      const { data: subcategories, error: subcategoryError } = await supabase
        .from('subcategories')
        .select(`
          id, 
          name, 
          description, 
          created_at,
          category_id
        `)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('user_id', user.id)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (!subcategoryError && subcategories) {
        const subcategoryResults: SearchResult[] = subcategories.map(subcategory => ({
          entity_id: subcategory.id,
          title: subcategory.name,
          snippet: subcategory.description || '',
          source: 'subcategory' as const,
          similarity: 0.85, // Placeholder similarity score
          updated_at: subcategory.created_at,
          metadata: {
            category_id: subcategory.category_id
          }
        }));
        searchResults.push(...subcategoryResults);
      }
    }

    // Search in api_keys table
    if (!filters?.sources || filters.sources.includes('api-key')) {
      const { data: apiKeys, error: apiKeyError } = await supabase
        .from('api_keys')
        .select('id, service_name, key_name, notes, created_at')
        .or(`service_name.ilike.%${searchQuery}%,key_name.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
        .eq('user_id', user.id)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (!apiKeyError && apiKeys) {
        const apiKeyResults: SearchResult[] = apiKeys.map(apiKey => ({
          entity_id: apiKey.id,
          title: `${apiKey.service_name} - ${apiKey.key_name}`,
          snippet: apiKey.notes || '',
          source: 'api-key' as const,
          similarity: 0.75, // Placeholder similarity score
          updated_at: apiKey.created_at,
          metadata: {
            service: apiKey.service_name,
            keyName: apiKey.key_name
          }
        }));
        searchResults.push(...apiKeyResults);
      }
    }

    // Sort results by similarity and recency
    searchResults.sort((a, b) => {
      // First by similarity (descending)
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      // Then by recency (descending)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    // Apply pagination
    const paginatedResults = searchResults.slice(0, limit);
    totalCount = searchResults.length;

    const response: SearchResponse = {
      query: searchQuery,
      results: paginatedResults,
      total: totalCount,
      page,
      limit,
      timestamp,
      filters
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
