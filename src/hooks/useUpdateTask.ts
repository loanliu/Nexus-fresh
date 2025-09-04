'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Project } from '@/types/project-management';

type Patch = { 
  id: string; 
  title?: string; 
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  effort?: number;
  estimated_hours?: number;
  due_date?: string;
};

export function useUpdateTask(projectId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Patch) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", patch.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onMutate: async (patch: Patch) => {
      console.log('🔄 useUpdateTask: Starting optimistic update for:', { patch, projectId });
      
      // Cancel any outgoing refetches for projects
      await queryClient.cancelQueries({ queryKey: ['project-management', 'projects'] });
      
      // Snapshot the previous projects value
      const previousProjects = queryClient.getQueryData<Project[]>(['project-management', 'projects']);
      console.log('📸 useUpdateTask: Previous projects data:', previousProjects);
      
      // Optimistically update the projects data
      if (previousProjects && projectId) {
        const optimisticProjects = previousProjects.map(project => {
          if (project.id === projectId && project.tasks) {
            console.log('🔄 useUpdateTask: Updating project:', project.id, 'with tasks:', project.tasks.length);
            
            // Find if this task exists in this project
            const taskExists = project.tasks.some(task => task.id === patch.id);
            console.log('🔍 useUpdateTask: Task exists in project:', taskExists);
            
            if (taskExists) {
              const optimisticTasks = project.tasks.map(task => 
                task.id === patch.id 
                  ? { ...task, ...patch }
                  : task
              );
              return { ...project, tasks: optimisticTasks };
            }
          }
          return project;
        });
        
        console.log('🚀 useUpdateTask: Setting optimistic data:', optimisticProjects);
        queryClient.setQueryData(['project-management', 'projects'], optimisticProjects);
        
        // Verify the cache was updated
        const updatedCache = queryClient.getQueryData<Project[]>(['project-management', 'projects']);
        console.log('✅ useUpdateTask: Cache after optimistic update:', updatedCache);
      } else {
        console.log('⚠️ useUpdateTask: No previous projects data or projectId:', { previousProjects, projectId });
      }
      
      // Return a context object with the snapshotted value
      return { previousProjects };
    },
    onError: (err, patch, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProjects) {
        queryClient.setQueryData(['project-management', 'projects'], context.previousProjects);
      }
    },
    onSuccess: (updatedTask) => {
      console.log('✅ useUpdateTask: Server update successful, updating cache with:', updatedTask);
      
      // Update the projects cache with the server response
      queryClient.setQueryData<Project[]>(['project-management', 'projects'], (oldProjects) => {
        if (!oldProjects) return oldProjects;
        
        const updatedProjects = oldProjects.map(project => {
          if (project.id === projectId && project.tasks) {
            const updatedTasks = project.tasks.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            );
            return { ...project, tasks: updatedTasks };
          }
          return project;
        });
        
        console.log('🔄 useUpdateTask: Cache updated with server response:', updatedProjects);
        return updatedProjects;
      });

      // CRITICAL: Also invalidate the project management tasks cache used by Daily Digest
      console.log('🔄 useUpdateTask: Invalidating project management tasks cache for Daily Digest refresh');
      queryClient.invalidateQueries({ queryKey: ['project-management', 'tasks'] });
      
      // Also invalidate the useTasks cache for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    },
    onSettled: () => {
      console.log('🔄 useUpdateTask: Mutation settled, NOT invalidating to preserve optimistic updates');
      // Don't invalidate immediately - let optimistic updates work naturally
      // The cache is already updated with the server response in onSuccess
    },
  });
}
