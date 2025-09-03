// Task Manager MVP Hook
// Phase 1: Core Data Management with TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { 
  Task, 
  Project, 
  Label, 
  Comment, 
  Attachment, 
  SavedFilter,
  TaskFormData,
  CreateTaskData,
  ProjectFormData,
  LabelFormData,
  CommentFormData,
  FilterConfig
} from '@/types/task-manager';

// Query Keys
const QUERY_KEYS = {
  tasks: ['tasks'] as const,
  task: (id: string) => ['tasks', id] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  labels: ['labels'] as const,
  label: (id: string) => ['labels', id] as const,
  comments: (taskId: string) => ['comments', taskId] as const,
  attachments: (taskId: string) => ['attachments', taskId] as const,
  savedFilters: ['savedFilters'] as const,
  filteredTasks: (filters: FilterConfig) => ['tasks', 'filtered', filters] as const,
} as const;

// Task Management
export const useTasks = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tasks,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_labels(label_id(*)),
          subtasks:tasks!parent_task_id(*),
          comments(*),
          attachments(*),
          project:projects(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw tasks data:', data);
      
      // Transform the data to flatten the labels structure
      const transformedData = (data || []).map(task => {
        console.log('Task labels before transform:', task.labels);
        const transformed = {
          ...task,
          labels: task.labels?.map((tl: any) => tl.label_id).filter(Boolean) || []
        };
        console.log('Task labels after transform:', transformed.labels);
        return transformed;
      });
      
      return transformedData;
    },
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.task(id),
    queryFn: async (): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          labels:task_labels(label_id(*)),
          subtasks:tasks!parent_task_id(*),
          comments(*),
          attachments(*),
          project:projects(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform the data to flatten the labels structure
      const transformedTask = {
        ...data,
        labels: data.labels?.map((tl: any) => tl.label_id).filter(Boolean) || []
      };
      
      return transformedTask;
    },
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: CreateTaskData): Promise<Task> => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Extract label_ids from taskData and remove it for the main task insert
      const { label_ids, ...taskInsertData } = taskData;

      // Insert the task first
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert([{ ...taskInsertData, user_id: user.id }])
        .select()
        .single();

      if (taskError) throw taskError;

      // If labels were selected, insert them into the task_labels junction table
      if (label_ids && label_ids.length > 0) {
        const taskLabelInserts = label_ids.map(labelId => ({
          task_id: task.id,
          label_id: labelId
        }));

        const { error: labelError } = await supabase
          .from('task_labels')
          .insert(taskLabelInserts);

        if (labelError) {
          console.error('Failed to insert task labels:', labelError);
          // Don't throw here - the task was created successfully
        }
      }

      return task;
    },
    onSuccess: (newTask) => {
      // Invalidate task manager cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      
      // CRITICAL: Also invalidate project management cache to sync both systems
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'projects'] });
      if (newTask.project_id) {
        queryClient.invalidateQueries({ queryKey: ['project-management', 'projects', newTask.project_id] });
      }
      
      // CRITICAL: Also invalidate the ManageTasksModal cache (useTasks hook)
      queryClient.invalidateQueries({ queryKey: ['tasks', newTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, label_ids, ...taskData }: Partial<Task> & { id: string; label_ids?: string[] }): Promise<Task> => {
      // Update the main task first
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', id)
        .select()
        .single();

      if (taskError) throw taskError;

      // If label_ids are provided, update the label associations
      if (label_ids !== undefined) {
        // First, remove all existing label associations for this task
        const { error: deleteError } = await supabase
          .from('task_labels')
          .delete()
          .eq('task_id', id);

        if (deleteError) {
          console.error('Failed to remove existing task labels:', deleteError);
          // Don't throw here - the task was updated successfully
        }

        // Then, insert the new label associations
        if (label_ids.length > 0) {
          const taskLabelInserts = label_ids.map(labelId => ({
            task_id: id,
            label_id: labelId
          }));

          const { error: labelError } = await supabase
            .from('task_labels')
            .insert(taskLabelInserts);

          if (labelError) {
            console.error('Failed to insert new task labels:', labelError);
            // Don't throw here - the task was updated successfully
          }
        }
      }

      return task;
    },
    onSuccess: (updatedTask) => {
      // Invalidate task manager cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.task(updatedTask.id) });
      
      // CRITICAL: Also invalidate project management cache to sync both systems
      queryClient.invalidateQueries({ queryKey: ['tasks', updatedTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'projects'] });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: ['project-management', 'projects', updatedTask.project_id] });
      }
      
      // CRITICAL: Also invalidate the ManageTasksModal cache (useTasks hook)
      queryClient.invalidateQueries({ queryKey: ['tasks', updatedTask.project_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate task manager cache
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
      
      // CRITICAL: Also invalidate project management cache to sync both systems
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-management', 'projects'] });
      
      // CRITICAL: Also invalidate the ManageTasksModal cache (useTasks hook)
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Project Management
export const useProjects = () => {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectData: ProjectFormData): Promise<Project> => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...projectData }: Partial<Project> & { id: string }): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects });
    },
  });
};

// Label Management
export const useLabels = () => {
  return useQuery({
    queryKey: QUERY_KEYS.labels,
    queryFn: async (): Promise<Label[]> => {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (labelData: LabelFormData): Promise<Label> => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('labels')
        .insert([{ ...labelData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.labels });
    },
  });
};

// Comment Management
export const useComments = (taskId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments(taskId),
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentData: CommentFormData): Promise<Comment> => {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('comments')
        .insert([{ ...commentData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (comment) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments(comment.task_id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tasks });
    },
  });
};

// Saved Filters
export const useSavedFilters = () => {
  return useQuery({
    queryKey: QUERY_KEYS.savedFilters,
    queryFn: async (): Promise<SavedFilter[]> => {
      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

// Filtered Tasks
export const useFilteredTasks = (filters: FilterConfig) => {
  return useQuery({
    queryKey: QUERY_KEYS.filteredTasks(filters),
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          labels:task_labels(label_id(*)),
          subtasks:tasks!parent_task_id(*),
          comments(*),
          attachments(*),
          project:projects(*)
        `);

      // Apply filters
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.project_id?.length) {
        query = query.in('project_id', filters.project_id);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: Object.keys(filters).length > 0,
  });
};
