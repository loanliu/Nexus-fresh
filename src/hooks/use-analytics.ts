'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export interface AnalyticsData {
  // Overview metrics
  totalResources: number;
  totalTasks: number;
  totalCategories: number;
  totalApiKeys: number;
  totalProjects: number;
  
  // Resource analytics
  resourcesByCategory: Record<string, number>;
  resourcesByType: Record<string, number>;
  storageUsed: number;
  recentUploads: number;
  
  // Task analytics
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByProject: Record<string, number>;
  completedTasksThisWeek: number;
  overdueTasks: number;
  
  // Category analytics
  categoriesWithMostResources: Array<{ name: string; count: number }>;
  categoriesWithMostTasks: Array<{ name: string; count: number }>;
  
  // Time-based analytics
  resourcesAddedThisWeek: number;
  resourcesAddedThisMonth: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  
  // Google Drive analytics
  googleDriveFiles: number;
  googleDriveStorage: number;
  recentGoogleDriveActivity: number;
  
  // API usage analytics
  apiKeysByService: Record<string, number>;
  activeApiKeys: number;
  
  // Project analytics
  projectsByStatus: Record<string, number>;
  activeProjects: number;
  completedProjects: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export function useAnalytics(timeRange?: TimeRange) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [
        resourcesData,
        tasksData,
        categoriesData,
        apiKeysData,
        projectsData,
        googleTokensData
      ] = await Promise.all([
        fetchResourcesAnalytics(user.id),
        fetchTasksAnalytics(user.id),
        fetchCategoriesAnalytics(user.id),
        fetchApiKeysAnalytics(user.id),
        fetchProjectsAnalytics(user.id),
        fetchGoogleDriveAnalytics(user.id)
      ]);

      // Combine all data
      const analyticsData: AnalyticsData = {
        ...resourcesData,
        ...tasksData,
        ...categoriesData,
        ...apiKeysData,
        ...projectsData,
        ...googleTokensData
      };

      setData(analyticsData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  };
}

// Helper functions to fetch specific analytics data
async function fetchResourcesAnalytics(userId: string) {
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', userId);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  const resourcesByCategory: Record<string, number> = {};
  const resourcesByType: Record<string, number> = {};
  let storageUsed = 0;
  let recentUploads = 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  resources?.forEach(resource => {
    // Count by category
    const category = categories?.find(c => c.id === resource.category_id);
    if (category) {
      resourcesByCategory[category.name] = (resourcesByCategory[category.name] || 0) + 1;
    }

    // Count by type (file extension)
    const fileType = resource.file_name?.split('.').pop()?.toLowerCase() || 'unknown';
    resourcesByType[fileType] = (resourcesByType[fileType] || 0) + 1;

    // Storage calculation (assuming size is in bytes)
    if (resource.file_size) {
      storageUsed += resource.file_size;
    }

    // Recent uploads
    if (new Date(resource.created_at) > oneWeekAgo) {
      recentUploads++;
    }
  });

  return {
    totalResources: resources?.length || 0,
    resourcesByCategory,
    resourcesByType,
    storageUsed,
    recentUploads,
    resourcesAddedThisWeek: recentUploads,
    resourcesAddedThisMonth: resources?.filter(r => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(r.created_at) > oneMonthAgo;
    }).length || 0
  };
}

async function fetchTasksAnalytics(userId: string) {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  const tasksByStatus: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  const tasksByProject: Record<string, number> = {};
  let completedTasksThisWeek = 0;
  let overdueTasks = 0;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const now = new Date();

  tasks?.forEach(task => {
    // Count by status
    tasksByStatus[task.status || 'pending'] = (tasksByStatus[task.status || 'pending'] || 0) + 1;

    // Count by priority
    tasksByPriority[task.priority || 'medium'] = (tasksByPriority[task.priority || 'medium'] || 0) + 1;

    // Count by project
    if (task.project_id) {
      const project = projects?.find(p => p.id === task.project_id);
      if (project) {
        tasksByProject[project.name] = (tasksByProject[project.name] || 0) + 1;
      }
    }

    // Completed this week
    if (task.status === 'completed' && new Date(task.updated_at) > oneWeekAgo) {
      completedTasksThisWeek++;
    }

    // Overdue tasks
    if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') {
      overdueTasks++;
    }
  });

  return {
    totalTasks: tasks?.length || 0,
    tasksByStatus,
    tasksByPriority,
    tasksByProject,
    completedTasksThisWeek,
    overdueTasks,
    tasksCompletedThisWeek: completedTasksThisWeek,
    tasksCompletedThisMonth: tasks?.filter(t => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return t.status === 'completed' && new Date(t.updated_at) > oneMonthAgo;
    }).length || 0
  };
}

async function fetchCategoriesAnalytics(userId: string) {
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);

  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', userId);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  // Categories with most resources
  const categoryResourceCounts = categories?.map(category => {
    const count = resources?.filter(r => r.category_id === category.id).length || 0;
    return { name: category.name, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5) || [];

  // Categories with most tasks
  const categoryTaskCounts = categories?.map(category => {
    const count = tasks?.filter(t => t.category_id === category.id).length || 0;
    return { name: category.name, count };
  }).sort((a, b) => b.count - a.count).slice(0, 5) || [];

  return {
    totalCategories: categories?.length || 0,
    categoriesWithMostResources: categoryResourceCounts,
    categoriesWithMostTasks: categoryTaskCounts
  };
}

async function fetchApiKeysAnalytics(userId: string) {
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('user_id', userId);

  const apiKeysByService: Record<string, number> = {};
  let activeApiKeys = 0;

  apiKeys?.forEach(apiKey => {
    // Count by service
    apiKeysByService[apiKey.service_name || 'unknown'] = (apiKeysByService[apiKey.service_name || 'unknown'] || 0) + 1;

    // Count active keys (assuming they have a valid key)
    if (apiKey.encrypted_key && apiKey.encrypted_key.length > 0) {
      activeApiKeys++;
    }
  });

  return {
    totalApiKeys: apiKeys?.length || 0,
    apiKeysByService,
    activeApiKeys
  };
}

async function fetchProjectsAnalytics(userId: string) {
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId);

  const projectsByStatus: Record<string, number> = {};
  let activeProjects = 0;
  let completedProjects = 0;

  projects?.forEach(project => {
    // Count by status
    projectsByStatus[project.status || 'active'] = (projectsByStatus[project.status || 'active'] || 0) + 1;

    // Count active and completed
    if (project.status === 'active') {
      activeProjects++;
    } else if (project.status === 'completed') {
      completedProjects++;
    }
  });

  return {
    totalProjects: projects?.length || 0,
    projectsByStatus,
    activeProjects,
    completedProjects
  };
}

async function fetchGoogleDriveAnalytics(userId: string) {
  const { data: googleTokens } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId);

  // This is a placeholder - in a real implementation, you'd fetch actual Google Drive stats
  // For now, we'll return basic connection info
  const hasGoogleDriveAccess = googleTokens && googleTokens.length > 0;

  return {
    googleDriveFiles: hasGoogleDriveAccess ? 20 : 0, // Placeholder
    googleDriveStorage: hasGoogleDriveAccess ? 1024 * 1024 * 100 : 0, // 100MB placeholder
    recentGoogleDriveActivity: hasGoogleDriveAccess ? 5 : 0 // Placeholder
  };
}
