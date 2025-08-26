'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// Query key factory for subtasks
export const subtasksKey = (taskId: string) => ["subtasks", taskId];

// Type definition matching our database schema
export type Subtask = { 
  id: string; 
  task_id: string; 
  title: string; 
  done: boolean; 
  order_index: number; 
  status?: string | null;
  estimate_hours?: number | null;
  created_at?: string;
};

// Hook to fetch subtasks for a specific task
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtasksKey(taskId),
    queryFn: async (): Promise<Subtask[]> => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index');
      
      if (error) {
        console.error('❌ Error fetching subtasks:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 0, // Always fetch fresh data
    enabled: !!taskId, // Only run when taskId is provided
  });
}

// Hook to create a new subtask
export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ title, order_index, status, estimate_hours }: { title: string; order_index: number; status?: string; estimate_hours?: number | null }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({ 
          task_id: taskId, 
          title, 
          order_index,
          status: status || 'pending',
          estimate_hours: estimate_hours || null
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating subtask:', error);
        throw error;
      }
      
      return data;
    },
    onMutate: async ({ title, order_index, status, estimate_hours }) => {
      console.log('🔄 useCreateSubtask: Starting optimistic update');
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: subtasksKey(taskId) });
      
      // Snapshot the previous value
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtasksKey(taskId));
      
      // Create optimistic subtask with temporary client ID
      const optimisticSubtask: Subtask = {
        id: `temp-${Date.now()}`,
        task_id: taskId,
        title,
        done: false,
        order_index,
        status: status || 'pending',
        estimate_hours: estimate_hours || null,
        created_at: new Date().toISOString()
      };
      
      // Optimistically update the cache
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return [optimisticSubtask];
        return [...old, optimisticSubtask].sort((a, b) => a.order_index - b.order_index);
      });
      
      // Return context for rollback
      return { previousSubtasks, optimisticSubtask };
    },
    onSuccess: (newSubtask, variables, context) => {
      console.log('✅ useCreateSubtask: Server update successful, replacing optimistic data');
      
      // Replace optimistic subtask with server data
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return [newSubtask];
        return old.map(subtask => 
          subtask.id === context?.optimisticSubtask.id ? newSubtask : subtask
        ).sort((a, b) => a.order_index - b.order_index);
      });
    },
    onError: (err, variables, context) => {
      console.error('❌ useCreateSubtask: Error occurred, rolling back optimistic update');
      
      // Rollback on error
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtasksKey(taskId), context.previousSubtasks);
      }
    },
    onSettled: () => {
      // Always invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: subtasksKey(taskId) });
    }
  });
}

// Hook to toggle subtask completion status
export function useToggleSubtask(taskId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ done })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error toggling subtask:', error);
        throw error;
      }
      
      return data;
    },
    onMutate: async ({ id, done }) => {
      console.log('🔄 useToggleSubtask: Starting optimistic update');
      
      await queryClient.cancelQueries({ queryKey: subtasksKey(taskId) });
      
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtasksKey(taskId));
      
      // Optimistically update the cache
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return old;
        return old.map(subtask => 
          subtask.id === id ? { ...subtask, done } : subtask
        );
      });
      
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      console.error('❌ useToggleSubtask: Error occurred, rolling back optimistic update');
      
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtasksKey(taskId), context.previousSubtasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtasksKey(taskId) });
    }
  });
}

// Hook to rename a subtask
export function useRenameSubtask(taskId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { data, error } = await supabase
        .from('subtasks')
        .update({ title })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error renaming subtask:', error);
        throw error;
      }
      
      return data;
    },
    onMutate: async ({ id, title }) => {
      console.log('🔄 useRenameSubtask: Starting optimistic update');
      
      await queryClient.cancelQueries({ queryKey: subtasksKey(taskId) });
      
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtasksKey(taskId));
      
      // Optimistically update the cache
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return old;
        return old.map(subtask => 
          subtask.id === id ? { ...subtask, title } : subtask
        );
      });
      
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      console.error('❌ useRenameSubtask: Error occurred, rolling back optimistic update');
      
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtasksKey(taskId), context.previousSubtasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtasksKey(taskId) });
    }
  });
}

// Hook to reorder subtasks
export function useReorderSubtasks(taskId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reorderedSubtasks: { id: string; order_index: number }[]) => {
      // Use a transaction-like approach with multiple updates
      const updates = reorderedSubtasks.map(({ id, order_index }) =>
        supabase
          .from('subtasks')
          .update({ order_index })
          .eq('id', id)
          .select()
          .single()
      );
      
      const results = await Promise.all(updates);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('❌ Error reordering subtasks:', errors);
        throw new Error('Failed to reorder some subtasks');
      }
      
      return results.map(result => result.data!);
    },
    onMutate: async (reorderedSubtasks) => {
      console.log('🔄 useReorderSubtasks: Starting optimistic update');
      
      await queryClient.cancelQueries({ queryKey: subtasksKey(taskId) });
      
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtasksKey(taskId));
      
      // Create a map for quick lookup
      const orderMap = new Map(
        reorderedSubtasks.map(({ id, order_index }) => [id, order_index])
      );
      
      // Optimistically update the cache with new order
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return old;
        return old.map(subtask => ({
          ...subtask,
          order_index: orderMap.get(subtask.id) ?? subtask.order_index
        })).sort((a, b) => a.order_index - b.order_index);
      });
      
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      console.error('❌ useReorderSubtasks: Error occurred, rolling back optimistic update');
      
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtasksKey(taskId), context.previousSubtasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtasksKey(taskId) });
    }
  });
}

// Hook to delete a subtask
export function useDeleteSubtask(taskId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Error deleting subtask:', error);
        throw error;
      }
      
      return id;
    },
    onMutate: async (id) => {
      console.log('🔄 useDeleteSubtask: Starting optimistic update');
      
      await queryClient.cancelQueries({ queryKey: subtasksKey(taskId) });
      
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtasksKey(taskId));
      
      // Optimistically remove from cache
      queryClient.setQueryData<Subtask[]>(subtasksKey(taskId), (old) => {
        if (!old) return old;
        return old.filter(subtask => subtask.id !== id);
      });
      
      return { previousSubtasks };
    },
    onError: (err, variables, context) => {
      console.error('❌ useDeleteSubtask: Error occurred, rolling back optimistic update');
      
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtasksKey(taskId), context.previousSubtasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: subtasksKey(taskId) });
    }
  });
}
