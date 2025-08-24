import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { projectManagementClient } from '@/lib/project-management-client';
import { 
  Project, 
  Task, 
  Label, 
  Comment, 
  CreateTaskData, 
  UpdateTaskData, 
  CreateProjectData, 
  UpdateProjectData,
  ProjectFormData,
  FilterConfig,
  DailyDigestSettings,
  UpdateProjectTemplateData
} from '@/types/project-management';

// Query keys
export const projectManagementKeys = {
  all: ['project-management'] as const,
  projects: () => [...projectManagementKeys.all, 'projects'] as const,
  project: (id: string) => [...projectManagementKeys.projects(), id] as const,
  tasks: (filters?: FilterConfig) => [...projectManagementKeys.all, 'tasks', filters] as const,
  task: (id: string) => [...projectManagementKeys.all, 'tasks', id] as const,
  labels: () => [...projectManagementKeys.all, 'labels'] as const,
  comments: (taskId: string) => [...projectManagementKeys.all, 'comments', taskId] as const,
  templates: () => [...projectManagementKeys.all, 'templates'] as const,
  digestSettings: () => [...projectManagementKeys.all, 'digest-settings'] as const,
  savedFilters: () => [...projectManagementKeys.all, 'saved-filters'] as const,
  template: (id: string) => [...projectManagementKeys.templates(), id] as const,
};

// Projects
export const useProjects = () => {
  return useQuery({
    queryKey: projectManagementKeys.projects(),
    queryFn: projectManagementClient.getProjects,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: projectManagementKeys.project(id),
    queryFn: () => projectManagementClient.getProject(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.createProject,
    onSuccess: (newProject) => {
      console.log('useCreateProject onSuccess called with:', newProject);
      console.log('Invalidating queries with key:', projectManagementKeys.projects());
      
      // Invalidate and refetch the projects query
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.projects() });
      
      // Also try to manually update the cache
      queryClient.setQueryData(projectManagementKeys.projects(), (oldData: Project[] | undefined) => {
        console.log('Old projects data:', oldData);
        if (oldData) {
          const updatedData = [newProject, ...oldData];
          console.log('Updated projects data:', updatedData);
          return updatedData;
        }
        return [newProject];
      });
      
      toast.success('Project created successfully!');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectFormData> }) =>
      projectManagementClient.updateProject(id, { ...updates, id }),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.projects() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedProject.id) });
      toast.success('Project updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.deleteProject,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.projects() });
      queryClient.removeQueries({ queryKey: projectManagementKeys.project(deletedId) });
      toast.success('Project deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    },
  });
};

export const useArchiveProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.archiveProject,
    onSuccess: (_, archivedId) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.projects() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(archivedId) });
      toast.success('Project archived successfully!');
    },
    onError: (error) => {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    },
  });
};

// Tasks
export const useTasks = (filters?: FilterConfig) => {
  return useQuery({
    queryKey: projectManagementKeys.tasks(filters),
    queryFn: () => projectManagementClient.getTasks(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: projectManagementKeys.task(id),
    queryFn: () => projectManagementClient.getTask(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.createTask,
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      if (newTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(newTask.project_id) });
      }
      toast.success('Task created successfully!');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskData }) =>
      projectManagementClient.updateTask(id, updates),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.task(updatedTask.id) });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedTask.project_id) });
      }
      toast.success('Task updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.deleteTask,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.removeQueries({ queryKey: projectManagementKeys.task(deletedId) });
      toast.success('Task deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      projectManagementClient.updateTaskStatus(id, status),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.task(updatedTask.id) });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedTask.project_id) });
      }
      toast.success('Task status updated!');
    },
    onError: (error) => {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    },
  });
};

export const useUpdateTaskPriority = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, priority }: { id: string; priority: Task['priority'] }) =>
      projectManagementClient.updateTaskPriority(id, priority),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.task(updatedTask.id) });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedTask.project_id) });
      }
    },
    onError: (error) => {
      console.error('Error updating task priority:', error);
      toast.error('Failed to update task priority');
    },
  });
};

export const useUpdateTaskDueDate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, due_date }: { id: string; due_date: string }) =>
      projectManagementClient.updateTaskDueDate(id, due_date),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.task(updatedTask.id) });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedTask.project_id) });
      }
    },
    onError: (error) => {
      console.error('Error updating task due date:', error);
      toast.error('Failed to update task due date');
    },
  });
};

export const useSnoozeTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, snoozed_until }: { id: string; snoozed_until: string }) =>
      projectManagementClient.snoozeTask(id, snoozed_until),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.task(updatedTask.id) });
      if (updatedTask.project_id) {
        queryClient.invalidateQueries({ queryKey: projectManagementKeys.project(updatedTask.project_id) });
      }
      toast.success('Task snoozed successfully!');
    },
    onError: (error) => {
      console.error('Error snoozing task:', error);
      toast.error('Failed to snooze task');
    },
  });
};

export const useReorderTasks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.reorderTasks,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
    },
    onError: (error) => {
      console.error('Error reordering tasks:', error);
      toast.error('Failed to reorder tasks');
    },
  });
};

// Labels
export const useLabels = () => {
  return useQuery({
    queryKey: projectManagementKeys.labels(),
    queryFn: projectManagementClient.getLabels,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useCreateLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.createLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.labels() });
      toast.success('Label created successfully!');
    },
    onError: (error) => {
      console.error('Error creating label:', error);
      toast.error('Failed to create label');
    },
  });
};

export const useUpdateLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Label> }) =>
      projectManagementClient.updateLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.labels() });
      toast.success('Label updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating label:', error);
      toast.error('Failed to update label');
    },
  });
};

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.labels() });
      toast.success('Label deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting label:', error);
      toast.error('Failed to delete label');
    },
  });
};

// Comments
export const useTaskComments = (taskId: string) => {
  return useQuery({
    queryKey: projectManagementKeys.comments(taskId),
    queryFn: () => projectManagementClient.getTaskComments(taskId),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.createComment,
    onSuccess: (newComment) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.comments(newComment.task_id) });
      toast.success('Comment added successfully!');
    },
    onError: (error) => {
      console.error('Error creating comment:', error);
      toast.error('Failed to add comment');
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      projectManagementClient.updateComment(id, content),
    onSuccess: (updatedComment) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.comments(updatedComment.task_id) });
      toast.success('Comment updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.deleteComment,
    onSuccess: (_, deletedComment) => {
      // We need to get the task_id from the deleted comment
      // For now, we'll invalidate all comment queries
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.all });
      toast.success('Comment deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    },
  });
};

// Project Templates
export const useProjectTemplates = () => {
  return useQuery({
    queryKey: projectManagementKeys.templates(),
    queryFn: projectManagementClient.getProjectTemplates,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCreateProjectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.createProjectTemplate,
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.templates() });
      toast.success('Project template created successfully!');
    },
    onError: (error) => {
      console.error('Error creating project template:', error);
      toast.error('Failed to create project template');
    },
  });
};

export const useUpdateProjectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProjectTemplateData }) =>
      projectManagementClient.updateProjectTemplate(id, updates),
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.templates() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.template(updatedTemplate.id) });
      toast.success('Project template updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating project template:', error);
      toast.error('Failed to update project template');
    },
  });
};

export const useDeleteProjectTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.deleteProjectTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.templates() });
      toast.success('Project template deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting project template:', error);
      toast.error('Failed to delete project template');
    },
  });
};

export const useCreateProjectFromTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ templateId, projectData }: { templateId: string; projectData: CreateProjectData }) =>
      projectManagementClient.createProjectFromTemplate(templateId, projectData),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.projects() });
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.tasks() });
      toast.success('Project created from template successfully!');
    },
    onError: (error) => {
      console.error('Error creating project from template:', error);
      toast.error('Failed to create project from template');
    },
  });
};

export const useSaveProjectAsTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, templateName, templateDescription }: { 
      projectId: string; 
      templateName: string; 
      templateDescription?: string; 
    }) => projectManagementClient.saveProjectAsTemplate(projectId, templateName, templateDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.templates() });
      toast.success('Project saved as template successfully!');
    },
    onError: (error) => {
      console.error('Error saving project as template:', error);
      toast.error('Failed to save project as template');
    },
  });
};

// Daily Digest Settings
export const useDailyDigestSettings = () => {
  return useQuery({
    queryKey: projectManagementKeys.digestSettings(),
    queryFn: projectManagementClient.getDailyDigestSettings,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useUpdateDailyDigestSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectManagementClient.updateDailyDigestSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectManagementKeys.digestSettings() });
      toast.success('Daily digest settings updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating daily digest settings:', error);
      toast.error('Failed to update daily digest settings');
    },
  });
};

// Utility hooks
export const useTasksByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: [...projectManagementKeys.all, 'tasks-by-date', startDate, endDate],
    queryFn: () => projectManagementClient.getTasksByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useOverdueTasks = () => {
  return useQuery({
    queryKey: [...projectManagementKeys.all, 'overdue-tasks'],
    queryFn: projectManagementClient.getOverdueTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useSnoozedTasks = () => {
  return useQuery({
    queryKey: [...projectManagementKeys.all, 'snoozed-tasks'],
    queryFn: projectManagementClient.getSnoozedTasks,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
