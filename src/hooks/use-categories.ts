'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [userProjects, setUserProjects] = useState<Array<{id: string; name: string; color: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user projects for category filtering
  const fetchUserProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, projects(id, name, color)')
        .eq('user_id', user.id);

      if (error) throw error;

      const projects = data?.map(item => ({
        id: item.project_id,
        name: (item.projects as any)?.name || `Project ${item.project_id}`,
        color: (item.projects as any)?.color || '#3B82F6'
      })) || [];

      setUserProjects(projects);
      return projects;
    } catch (err) {
      console.error('Error fetching user projects:', err);
      return [];
    }
  }, [user]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    console.log('fetchCategories called, user:', user);
    
    if (!user) {
      console.log('No user found, skipping category fetch');
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching categories for user:', user.id);

      // Fetch categories using the new RLS policy that works through tasks
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      console.log('Categories query result:', { data, error: fetchError });

      if (fetchError) throw fetchError;

      let categories = data || [];
      
      // For each category, find which projects use it (for display purposes)
      if (categories && categories.length > 0) {
        console.log('🔍 Finding projects that use each category through resources');
        
        for (let i = 0; i < categories.length; i++) {
          const category = categories[i];
          
          // Find projects that use this category through resources
          const { data: projects, error: projectsError } = await supabase
            .from('resources')
            .select('project_id, projects(id, name, color)')
            .eq('category_id', category.id)
            .not('project_id', 'is', null);

          if (!projectsError && projects) {
            // Get unique project names
            const projectNames = Array.from(new Set(
              projects
                .filter(p => p.projects)
                .map(p => (p.projects as any).name)
            ));
            
            categories[i] = {
              ...category,
              shared_in_projects: projectNames
            };
          }
        }
      }

      setCategories(categories);
      console.log('Categories set to:', categories);

      // If no categories exist, offer to create default ones
      if (categories.length === 0) {
        console.log('No categories found, user might need to create some');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new category
  const addCategory = useCallback(async (categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return null;

    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCategories(prev => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
      return data;
    } catch (err) {
      console.error('Error adding category:', err);
      setError(err instanceof Error ? err.message : 'Failed to add category');
      return null;
    }
  }, [user]);

  // Update category
  const updateCategory = useCallback(async (categoryId: string, updates: Partial<Category>) => {
    if (!user) return null;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('categories')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', categoryId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setCategories(prev => 
        prev.map(category => 
          category.id === categoryId ? { ...category, ...data } : category
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
      return null;
    }
  }, [user]);

  // Delete category
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return false;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setCategories(prev => prev.filter(category => category.id !== categoryId));
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      return false;
    }
  }, [user]);

  // Create default categories for new users
  const createDefaultCategories = useCallback(async () => {
    if (!user) return false;

    try {
      setError(null);
      
      const defaultCategories = [
        {
          name: 'General',
          description: 'General resources and documents',
          color: '#6B7280',
          icon: 'folder',
          is_default: true,
          sort_order: 1
        },
        {
          name: 'Projects',
          description: 'Project-related resources',
          color: '#3B82F6',
          icon: 'briefcase',
          is_default: true,
          sort_order: 2
        },
        {
          name: 'Learning',
          description: 'Educational materials and courses',
          color: '#10B981',
          icon: 'book-open',
          is_default: true,
          sort_order: 3
        },
        {
          name: 'Reference',
          description: 'Reference materials and documentation',
          color: '#F59E0B',
          icon: 'bookmark',
          is_default: true,
          sort_order: 4
        }
      ];

      const results = [];
      for (const categoryData of defaultCategories) {
        const result = await addCategory(categoryData);
        if (result) results.push(result);
      }

      return results.length > 0;
    } catch (err) {
      console.error('Error creating default categories:', err);
      return false;
    }
  }, [user, addCategory]);

  // Fetch all subcategories (for refreshing after AI generation)
  const fetchAllSubcategories = useCallback(async () => {
    // This is a placeholder for the subcategory refresh functionality
    // It can be called after subcategory operations to refresh the parent component
    return true;
  }, []);

  // Initialize
  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchUserProjects();
    fetchCategories();
  }, [user, fetchUserProjects, fetchCategories]);

  return {
    categories,
    userProjects,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    createDefaultCategories,
    fetchAllSubcategories,
    fetchCategories,
    refetch: fetchCategories,
  };
}