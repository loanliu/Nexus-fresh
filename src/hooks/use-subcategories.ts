'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Subcategory } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';



export function useSubcategories(categoryId?: string) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { user } = useAuth();

  // Fetch subcategories for a specific category
  const fetchSubcategories = useCallback(async (catId: string) => {
    if (!catId) return [];

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', catId)
        .order('name');

      if (fetchError) throw fetchError;

      const subcategoriesData = data || [];
      setSubcategories(subcategoriesData);
      return subcategoriesData;
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subcategories');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate subcategories using AI
  const generateSubcategories = useCallback(async (categoryId: string, categoryName: string, categoryDescription?: string) => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/subcategories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          categoryName,
          categoryDescription
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate subcategories');
      }

      return data;
    } catch (err) {
      console.error('Error generating subcategories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate subcategories';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setGenerating(false);
    }
  }, []);

  // Add a new subcategory
  const addSubcategory = useCallback(async (subcategoryData: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([subcategoryData])
        .select()
        .single();

      if (error) throw error;

      // Update local state if we're viewing this category
      if (categoryId === subcategoryData.category_id) {
        setSubcategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }

      return data;
    } catch (err) {
      console.error('Error adding subcategory:', err);
      setError(err instanceof Error ? err.message : 'Failed to add subcategory');
      return null;
    }
  }, [categoryId]);

  // Update a subcategory
  const updateSubcategory = useCallback(async (id: string, updates: Partial<Subcategory>) => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSubcategories(prev =>
        prev.map(sub => sub.id === id ? { ...sub, ...updates } : sub)
      );

      return data;
    } catch (err) {
      console.error('Error updating subcategory:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subcategory');
      return null;
    }
  }, []);

  // Delete a subcategory
  const deleteSubcategory = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setSubcategories(prev => prev.filter(sub => sub.id !== id));

      return true;
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete subcategory');
      return false;
    }
  }, []);

  // Fetch subcategories when categoryId changes
  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
      setLoading(false);
    }
  }, [categoryId, fetchSubcategories]);

  return {
    subcategories,
    loading,
    error,
    generating,
    fetchSubcategories,
    generateSubcategories,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
  };
}