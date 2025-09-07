'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Resource, ResourceFormData } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [userProjects, setUserProjects] = useState<Array<{id: string; name: string; color: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch user projects
  const fetchUserProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data: userProjects, error: projectsError } = await supabase
        .from('project_members')
        .select(`
          project:projects(id, name, color)
        `)
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      const projects = (userProjects?.map(p => p.project).filter(Boolean) as unknown) as Array<{id: string; name: string; color: string}> || [];
      setUserProjects(projects);
    } catch (err) {
      console.error('Error fetching user projects:', err);
    }
  }, [user]);

  // Fetch resources
  const fetchResources = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's projects first
      const { data: userProjects, error: projectsError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      const projectIds = userProjects?.map(p => p.project_id) || [];
      console.log('🔍 User projects for resource filtering:', userProjects);
      console.log('🔍 Project IDs for filtering:', projectIds);

      // Fetch resources - try with project join first, fallback to basic query
      // Include resources owned by user OR from projects they're members of
      let { data, error: fetchError } = await supabase
        .from('resources')
        .select(`
          *,
          categories!inner(name, color, icon),
          projects(id, name, color)
        `)
        .or(`user_id.eq.${user.id},project_id.in.(${projectIds.length > 0 ? projectIds.join(',') : 'null'})`)
        .order('created_at', { ascending: false });

      // If the query fails (likely because project_id column doesn't exist yet), try without project join
      if (fetchError && fetchError.message.includes('project_id')) {
        console.log('🔍 Project column not found, falling back to basic query');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('resources')
          .select(`
            *,
            categories!inner(name, color, icon)
          `)
          .or(`user_id.eq.${user.id},project_id.in.(${projectIds.length > 0 ? projectIds.join(',') : 'null'})`)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        data = fallbackData;
        fetchError = null;
      }

      // If we have resources with project_id but no project data, fetch project names manually
      if (data && data.length > 0) {
        const resourcesWithProjectIds = data.filter(r => r.project_id && !r.project);
        if (resourcesWithProjectIds.length > 0) {
          console.log('🔍 Fetching project names for resources with project_id');
          const projectIds = Array.from(new Set(resourcesWithProjectIds.map(r => r.project_id)));
          
          const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .select('id, name, color')
            .in('id', projectIds);
          
          if (!projectsError && projects) {
            console.log('🔍 Fetched project names:', projects);
            // Add project data to resources
            data = data.map(resource => {
              if (resource.project_id && !resource.project) {
                const project = projects.find(p => p.id === resource.project_id);
                return { ...resource, project };
              }
              return resource;
            });
          }
        }
      }

      if (fetchError) throw fetchError;

      console.log('🔍 Fetched resources with project data:', data);
      setResources(data || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new resource
  const addResource = useCallback(async (resourceData: ResourceFormData): Promise<Resource | null> => {
    console.log('addResource called with:', { resourceData, user });
    
    if (!user) {
      console.log('No user found in addResource');
      return null;
    }

    try {
      setError(null);

      // Upload file if provided
      let fileUrl: string | undefined;
      let fileSize: number | undefined;
      let fileType: string | undefined;

      if (resourceData.file) {
        console.log('Uploading file to storage:', resourceData.file.name);
        
        const fileName = `${Date.now()}-${resourceData.file.name}`;
        const filePath = `resources/${user.id}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resources')
          .upload(filePath, resourceData.file);

        console.log('File upload result:', { uploadData, uploadError });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('resources')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileSize = resourceData.file.size;
        fileType = resourceData.file.type;
        
        console.log('File uploaded successfully:', { fileUrl, fileSize, fileType });
      }

      // Create resource record
      const resourceRecord = {
        title: resourceData.title,
        description: resourceData.description,
        category_id: resourceData.category_id,
        subcategory: resourceData.subcategory_id, // Note: DB uses 'subcategory' not 'subcategory_id'
        project_id: resourceData.project_id,
        tags: resourceData.tags,
        notes: resourceData.notes,
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType,
        user_id: user.id,
        is_favorite: false,
      };
      
      console.log('Inserting resource record:', resourceRecord);

      const { data, error: insertError } = await supabase
        .from('resources')
        .insert(resourceRecord)
        .select()
        .single();

      console.log('Resource insert result:', { data, insertError });

      if (insertError) throw insertError;

      // Add to local state
      setResources(prev => [data, ...prev]);

      console.log('Resource added successfully:', data);
      return data;
    } catch (err) {
      console.error('Error adding resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to add resource');
      return null;
    }
  }, [user]);

  // Update resource
  const updateResource = useCallback(async (resourceId: string, updates: Partial<Resource>): Promise<Resource | null> => {
    if (!user) return null;

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('resources')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resourceId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setResources(prev => 
        prev.map(resource => 
          resource.id === resourceId ? { ...resource, ...data } : resource
        )
      );

      return data;
    } catch (err) {
      console.error('Error updating resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to update resource');
      return null;
    }
  }, [user]);

  // Delete resource
  const deleteResource = useCallback(async (resourceId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);

      // Get resource to delete file from storage
      const resource = resources.find(r => r.id === resourceId);
      if (resource?.file_url) {
        // Extract file path from URL and delete from storage
        const filePath = resource.file_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('resources')
          .remove([filePath]);
      }

      // Delete resource record
      const { error: deleteError } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setResources(prev => prev.filter(resource => resource.id !== resourceId));

      return true;
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
      return false;
    }
  }, [user, resources]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (resourceId: string): Promise<boolean> => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return false;

    const newFavoriteState = !resource.is_favorite;
    
    try {
      const updatedResource = await updateResource(resourceId, { is_favorite: newFavoriteState });
      return !!updatedResource;
    } catch (err) {
      return false;
    }
  }, [resources, updateResource]);

  // Search resources
  const searchResources = useCallback(async (query: string, filters?: {
    categories?: string[];
    tags?: string[];
    fileTypes?: string[];
  }) => {
    if (!user) return [];

    try {
      let queryBuilder = supabase
        .from('resources')
        .select(`
          *,
          categories!inner(name, color, icon)
        `)
        .eq('user_id', user.id);

      // Apply text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
      }

      // Apply filters
      if (filters?.categories?.length) {
        queryBuilder = queryBuilder.in('category_id', filters.categories);
      }

      if (filters?.tags?.length) {
        queryBuilder = queryBuilder.overlaps('tags', filters.tags);
      }

      if (filters?.fileTypes?.length) {
        queryBuilder = queryBuilder.in('file_type', filters.fileTypes);
      }

      const { data, error } = await queryBuilder.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error searching resources:', err);
      return [];
    }
  }, [user]);

  // Get resources by category
  const getResourcesByCategory = useCallback((categoryId: string): Resource[] => {
    return resources.filter(resource => resource.category_id === categoryId);
  }, [resources]);

  // Get favorite resources
  const getFavoriteResources = useCallback((): Resource[] => {
    return resources.filter(resource => resource.is_favorite);
  }, [resources]);

  // Get recent resources
  const getRecentResources = useCallback((limit: number = 10): Resource[] => {
    return resources
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);
  }, [resources]);

  // Initialize and set up real-time subscription
  useEffect(() => {
    if (!user) {
      setResources([]);
      setUserProjects([]);
      setLoading(false);
      return;
    }

    fetchUserProjects();
    fetchResources();

    // Set up real-time subscription
    const subscription = supabase
      .channel('resources_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setResources(prev => [payload.new as Resource, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setResources(prev => 
              prev.map(resource => 
                resource.id === payload.new.id ? { ...resource, ...payload.new } : resource
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setResources(prev => prev.filter(resource => resource.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchResources]);

  return {
    resources,
    userProjects,
    loading,
    error,
    addResource,
    updateResource,
    deleteResource,
    toggleFavorite,
    searchResources,
    getResourcesByCategory,
    getFavoriteResources,
    getRecentResources,
    refetch: fetchResources,
  };
}