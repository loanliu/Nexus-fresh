'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const tasksKey = (projectId?: string) => ["tasks", projectId ?? "all"];

export type Task = { 
  id: string; 
  title: string; 
  description?: string; 
  status?: string;
  priority?: string;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  effort?: number;
  project_id?: string; 
  parent_task_id?: string;
  sort_order?: number;
  snoozed_until?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  user_id?: string;
  [k: string]: any 
};

export function useTasks(projectId?: string) {
  const queryKey = tasksKey(projectId);
  console.log('🔍 useTasks: Hook called with queryKey:', queryKey, 'projectId:', projectId);
  
  return useQuery({
    queryKey,
    queryFn: async (): Promise<Task[]> => {
      console.log('🔍 useTasks: Starting query for projectId:', projectId);
      
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .order('sort_order'); // Fixed: using correct column name
        
        if (projectId) {
          console.log('🔍 useTasks: Filtering by project_id:', projectId);
          query = query.eq('project_id', projectId);
        }
        
        console.log('🔍 useTasks: Executing query...');
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ useTasks: Supabase error:', error);
          throw error;
        }
        
        console.log('✅ useTasks: Query successful, data:', data);
        return data || [];
      } catch (error) {
        console.error('❌ useTasks: Unexpected error:', error);
        throw error;
      }
    },
    staleTime: 0,
  });
}
