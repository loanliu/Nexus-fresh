import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Subcategory, Tag } from '@/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch subcategories for a specific category
  const fetchSubcategories = useCallback(async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
      return [];
    }
  }, []);

  // Fetch all subcategories
  const fetchAllSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
    }
  }, []);

  // Fetch all tags
  const fetchTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tags');
    }
  }, []);

  // Add new category
  const addCategory = useCallback(async (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
      throw err;
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      // Also remove associated subcategories
      setSubcategories(prev => prev.filter(sub => sub.category_id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      throw err;
    }
  }, []);

  // Add new subcategory
  const addSubcategory = useCallback(async (subcategory: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([subcategory])
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subcategory');
      throw err;
    }
  }, []);

  // Update subcategory
  const updateSubcategory = useCallback(async (id: string, updates: Partial<Subcategory>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => prev.map(sub => sub.id === id ? data : sub));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subcategory');
      throw err;
    }
  }, []);

  // Delete subcategory
  const deleteSubcategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubcategories(prev => prev.filter(sub => sub.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subcategory');
      throw err;
    }
  }, []);

  // Add new tag
  const addTag = useCallback(async (tag: Omit<Tag, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([tag])
        .select()
        .single();

      if (error) throw error;
      
      setTags(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tag');
      throw err;
    }
  }, []);

  // Update tag
  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTags(prev => prev.map(tag => tag.id === id ? data : tag));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tag');
      throw err;
    }
  }, []);

  // Delete tag
  const deleteTag = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
      throw err;
    }
  }, []);

  // Get subcategories for a specific category
  const getSubcategoriesByCategory = useCallback((categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  }, [subcategories]);

  // Get tags by category
  const getTagsByCategory = useCallback((categoryId: string) => {
    return tags.filter(tag => tag.category_id === categoryId);
  }, [tags]);

  // Search categories by name
  const searchCategories = useCallback((query: string) => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(query.toLowerCase()) ||
      cat.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [categories]);

  // Search subcategories by name
  const searchSubcategories = useCallback((query: string) => {
    return subcategories.filter(sub => 
      sub.name.toLowerCase().includes(query.toLowerCase()) ||
      sub.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [subcategories]);

  // Search tags by name
  const searchTags = useCallback((query: string) => {
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(query.toLowerCase()) ||
      tag.description?.toLowerCase().includes(query.toLowerCase())
    );
  }, [tags]);

  // Initialize predefined categories if none exist
  const initializePredefinedCategories = useCallback(async () => {
    if (categories.length > 0) return;

    const predefinedCategories = [
      { name: 'AI Tools', description: 'Artificial Intelligence tools and platforms', color: '#3B82F6' },
      { name: 'SEO', description: 'Search Engine Optimization tools and resources', color: '#10B981' },
      { name: 'N8N Automations', description: 'N8N workflow automation tools and configurations', color: '#8B5CF6' },
      { name: 'Retell', description: 'Retell voice AI platform resources', color: '#F59E0B' },
      { name: 'Skool', description: 'Skool community and learning platform', color: '#EF4444' },
      { name: 'AI4Business', description: 'Business-focused AI solutions and tools', color: '#06B6D4' },
      { name: 'CRM', description: 'Customer Relationship Management tools', color: '#84CC16' },
      { name: 'ChatGPT Histories', description: 'ChatGPT conversation exports and histories', color: '#6366F1' },
      { name: 'Grok Histories', description: 'Grok AI conversation exports and histories', color: '#EC4899' },
      { name: 'Voice Agents', description: 'Voice AI agents and voice-related tools', color: '#F97316' },
      { name: 'Telegram Bots', description: 'Telegram bot development and management', color: '#0EA5E9' },
      { name: 'WhatsApp Bots', description: 'WhatsApp bot development and management', color: '#22C55E' }
    ];

    try {
      for (const category of predefinedCategories) {
        await addCategory({
          ...category,
          icon: 'folder',
          user_id: 'default',
          is_default: false,
          sort_order: 0
        });
      }
    } catch (err) {
      console.error('Failed to initialize predefined categories:', err);
    }
  }, [categories.length, addCategory]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchCategories(),
        fetchAllSubcategories(),
        fetchTags()
      ]);
    };

    loadData();
  }, [fetchCategories, fetchAllSubcategories, fetchTags]);

  // Initialize predefined categories after data is loaded
  useEffect(() => {
    if (!loading && categories.length === 0) {
      initializePredefinedCategories();
    }
  }, [loading, categories.length, initializePredefinedCategories]);

  // Set up real-time subscriptions
  useEffect(() => {
    const categoriesSubscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setCategories(prev => [...prev, payload.new as Category]);
        } else if (payload.eventType === 'UPDATE') {
          setCategories(prev => prev.map(cat => cat.id === payload.new.id ? payload.new as Category : cat));
        } else if (payload.eventType === 'DELETE') {
          setCategories(prev => prev.filter(cat => cat.id !== payload.old.id));
        }
      })
      .subscribe();

    const subcategoriesSubscription = supabase
      .channel('subcategories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setSubcategories(prev => [...prev, payload.new as Subcategory]);
        } else if (payload.eventType === 'UPDATE') {
          setSubcategories(prev => prev.map(sub => sub.id === payload.new.id ? payload.new as Subcategory : sub));
        } else if (payload.eventType === 'DELETE') {
          setSubcategories(prev => prev.filter(sub => sub.id !== payload.old.id));
        }
      })
      .subscribe();

    const tagsSubscription = supabase
      .channel('tags_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tags' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTags(prev => [...prev, payload.new as Tag]);
        } else if (payload.eventType === 'UPDATE') {
          setTags(prev => prev.map(tag => tag.id === payload.new.id ? payload.new as Tag : tag));
        } else if (payload.eventType === 'DELETE') {
          setTags(prev => prev.filter(tag => tag.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesSubscription);
      supabase.removeChannel(subcategoriesSubscription);
      supabase.removeChannel(tagsSubscription);
    };
  }, []);

  return {
    // State
    categories,
    subcategories,
    tags,
    loading,
    error,
    
    // Actions
    addCategory,
    updateCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    addTag,
    updateTag,
    deleteTag,
    
    // Queries
    getSubcategoriesByCategory,
    getTagsByCategory,
    searchCategories,
    searchSubcategories,
    searchTags,
    
    // Utilities
    fetchCategories,
    fetchSubcategories,
    fetchAllSubcategories,
    fetchTags,
    initializePredefinedCategories
  };
}
