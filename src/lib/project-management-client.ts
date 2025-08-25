import { createClient } from '@supabase/supabase-js';
import { 
  Project, 
  Task, 
  Label, 
  Comment, 
  Attachment, 
  ProjectTemplate, 
  DailyDigestSettings,
  SavedFilter,
  CreateTaskData,
  UpdateTaskData,
  CreateProjectData,
  UpdateProjectData,
  FilterConfig,
  PaginatedResponse,
  CreateProjectTemplateData,
  UpdateProjectTemplateData
} from '@/types/project-management';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Projects
export const projectManagementClient = {
  // Project operations
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (
          id,
          title,
          description,
          status,
          priority,
          due_date,
          effort,
          estimated_hours,
          actual_hours
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Debug logging
    console.log('getProjects result:', data);
    
    return data || [];
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        tasks (
          *,
          labels (*),
          subtasks (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProject(project: CreateProjectData): Promise<Project> {
    console.log('createProject called with:', project);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error in createProject:', authError);
      throw authError;
    }
    if (!user) {
      console.error('No user found in createProject');
      throw new Error('User not authenticated');
    }
    
    console.log('User authenticated:', user.id);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select(`
          *,
          tasks (
            id,
            title,
            description,
            status,
            priority,
            due_date,
            effort,
            estimated_hours,
            actual_hours
          )
        `)
        .single();

      if (error) {
        console.error('Database error in createProject:', error);
        throw error;
      }
      
      console.log('createProject result:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error in createProject:', error);
      throw error;
    }
  },

  async updateProject(id: string, updates: UpdateProjectData): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async archiveProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Task operations
  async getTasks(filters?: FilterConfig): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        labels (*),
        subtasks (*),
        comments (*)
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('sort_order', { ascending: true });

    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters.project_id?.length) {
        query = query.in('project_id', filters.project_id);
      }
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.effort_min !== undefined) {
        query = query.gte('effort', filters.effort_min);
      }
      if (filters.effort_max !== undefined) {
        query = query.lte('effort', filters.effort_max);
      }
      if (filters.is_overdue) {
        query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed');
      }
      if (filters.is_snoozed) {
        query = query.not('snoozed_until', 'is', null);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        labels (*),
        comments (*),
        attachments (*)
      `)
      .eq('id', id)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTask(task: CreateTaskData): Promise<Task> {
    const { label_ids, ...taskData } = task;
    
    // Create the task first
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) throw taskError;

    // Add labels if provided
    if (label_ids && label_ids.length > 0) {
      const labelRelations = label_ids.map(label_id => ({
        task_id: newTask.id,
        label_id
      }));

      const { error: labelError } = await supabase
        .from('task_labels')
        .insert(labelRelations);

      if (labelError) throw labelError;
    }

    // Return the task with labels
    return projectManagementClient.getTask(newTask.id) as Promise<Task>;
  },

  async updateTask(id: string, updates: UpdateTaskData): Promise<Task> {
    console.log('updateTask called with:', { id, updates });
    const { label_ids, id: updateId, ...taskData } = updates;
    
    console.log('taskData to update:', taskData);
    
    // Update the task
    const { error: taskError } = await supabase
      .from('tasks')
      .update(taskData)
      .eq('id', id);

    if (taskError) {
      console.error('Task update error:', taskError);
      throw taskError;
    }

    console.log('Task updated successfully, updating labels if needed');

    // Update labels if provided
    if (label_ids !== undefined) {
      // Remove existing labels
      await supabase
        .from('task_labels')
        .delete()
        .eq('task_id', id);

      // Add new labels
      if (label_ids.length > 0) {
        const labelRelations = label_ids.map(label_id => ({
          task_id: id,
          label_id
        }));

        const { error: labelError } = await supabase
          .from('task_labels')
          .insert(labelRelations);

        if (labelError) throw labelError;
      }
    }

    // Return the updated task
    console.log('Getting updated task with id:', id);
    const updatedTask = await projectManagementClient.getTask(id);
    console.log('Retrieved updated task:', updatedTask);
    return updatedTask as Task;
  },

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const updates: UpdateTaskData = { 
      id, 
      status
    };
    return projectManagementClient.updateTask(id, updates);
  },

  async updateTaskPriority(id: string, priority: Task['priority']): Promise<Task> {
    return projectManagementClient.updateTask(id, { id, priority });
  },

  async updateTaskDueDate(id: string, due_date: string): Promise<Task> {
    return projectManagementClient.updateTask(id, { id, due_date });
  },

  async snoozeTask(id: string, snoozed_until: string): Promise<Task> {
    return projectManagementClient.updateTask(id, { id, due_date: snoozed_until });
  },

  async reorderTasks(taskIds: string[]): Promise<void> {
    const updates = taskIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    const { error } = await supabase
      .from('tasks')
      .upsert(updates);

    if (error) throw error;
  },

  // Label operations
  async getLabels(): Promise<Label[]> {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createLabel(label: Omit<Label, 'id' | 'created_at' | 'user_id'>): Promise<Label> {
    const { data, error } = await supabase
      .from('labels')
      .insert(label)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLabel(id: string, updates: Partial<Label>): Promise<Label> {
    const { data, error } = await supabase
      .from('labels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLabel(id: string): Promise<void> {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Comment operations
  async getTaskComments(taskId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createComment(comment: Omit<Comment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateComment(id: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Project Templates operations
  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    const { data, error } = await supabase
      .from('project_templates')
      .select(`
        *,
        template_tasks (
          *,
          labels (*)
        )
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createProjectTemplate(templateData: CreateProjectTemplateData): Promise<ProjectTemplate> {
    const { tasks, ...templateInfo } = templateData;
    
    // Create the template
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .insert(templateInfo)
      .select()
      .single();

    if (templateError) throw templateError;

    // Create template tasks
    if (tasks.length > 0) {
      const templateTasks = tasks.map((task, index) => ({
        template_id: template.id,
        title: task.title,
        description: task.description,
        estimated_hours: task.estimated_hours,
        effort: task.effort,
        priority: task.priority,
        sort_order: index + 1
      }));

      const { error: tasksError } = await supabase
        .from('template_tasks')
        .insert(templateTasks);

      if (tasksError) throw tasksError;
    }

    return projectManagementClient.getProjectTemplate(template.id) as Promise<ProjectTemplate>;
  },

  async updateProjectTemplate(id: string, updates: UpdateProjectTemplateData): Promise<ProjectTemplate> {
    const { tasks, ...templateUpdates } = updates;
    
    // Update the template
    const { error: templateError } = await supabase
      .from('project_templates')
      .update(templateUpdates)
      .eq('id', id);

    if (templateError) throw templateError;

    // Update template tasks if provided
    if (tasks !== undefined) {
      // Remove existing tasks
      await supabase
        .from('template_tasks')
        .delete()
        .eq('template_id', id);

      // Add new tasks
      if (tasks.length > 0) {
        const templateTasks = tasks.map((task, index) => ({
          template_id: id,
          title: task.title,
          description: task.description,
          estimated_hours: task.estimated_hours,
          effort: task.effort,
          priority: task.priority,
          sort_order: index + 1
        }));

        const { error: tasksError } = await supabase
          .from('template_tasks')
          .insert(templateTasks);

        if (tasksError) throw tasksError;
      }
    }

    return projectManagementClient.getProjectTemplate(id) as Promise<ProjectTemplate>;
  },

  async deleteProjectTemplate(id: string): Promise<void> {
    // Delete template tasks first (due to foreign key constraint)
    await supabase
      .from('template_tasks')
      .delete()
      .eq('template_id', id);

    // Delete the template
    const { error } = await supabase
      .from('project_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getProjectTemplate(id: string): Promise<ProjectTemplate> {
    const { data, error } = await supabase
      .from('project_templates')
      .select(`
        *,
        template_tasks (
          *,
          labels (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createProjectFromTemplate(templateId: string, projectData: CreateProjectData): Promise<Project> {
    // Get the template
    const template = await projectManagementClient.getProjectTemplate(templateId);
    
    // Create the project
    const project = await projectManagementClient.createProject(projectData);
    
    // Create tasks from template
    for (const templateTask of template.template_data.tasks || []) {
      await projectManagementClient.createTask({
        title: templateTask.title,
        description: templateTask.description,
        status: 'pending',
        priority: templateTask.priority,
        effort: templateTask.effort,
        estimated_hours: templateTask.estimated_hours,
        project_id: project.id,
        user_id: project.user_id
      });
    }
    
    return project;
  },

  async saveProjectAsTemplate(projectId: string, templateName: string, templateDescription?: string): Promise<ProjectTemplate> {
    // Get the project and its tasks
    const project = await projectManagementClient.getProject(projectId);
    if (!project) throw new Error('Project not found');
    
    // Get tasks for this project
    const projectTasks = await projectManagementClient.getTasks({ project_id: [projectId] });
    
    // Create template data
    const templateData: CreateProjectTemplateData = {
      name: templateName,
      description: templateDescription,
      category: 'Custom',
      estimated_duration: 7, // Default to 1 week
      complexity: 'moderate', // Default value
      tasks: projectTasks.map((task: Task) => ({
        title: task.title,
        description: task.description || '',
        estimated_hours: task.estimated_hours || 0,
        effort: task.effort,
        priority: task.priority
      })),
      user_id: project.user_id
    };
    
    return projectManagementClient.createProjectTemplate(templateData);
  },

  // Daily Digest operations
  async getDailyDigestSettings(): Promise<DailyDigestSettings | null> {
    const { data, error } = await supabase
      .from('daily_digest_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  },

  async updateDailyDigestSettings(settings: Partial<DailyDigestSettings>): Promise<DailyDigestSettings> {
    const { data, error } = await supabase
      .from('daily_digest_settings')
      .upsert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Saved Filter operations
  async getSavedFilters(): Promise<SavedFilter[]> {
    const { data, error } = await supabase
      .from('saved_filters')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async createSavedFilter(filter: Omit<SavedFilter, 'id' | 'created_at'>): Promise<SavedFilter> {
    const { data, error } = await supabase
      .from('saved_filters')
      .insert(filter)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSavedFilter(id: string, updates: Partial<SavedFilter>): Promise<SavedFilter> {
    const { data, error } = await supabase
      .from('saved_filters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSavedFilter(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_filters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Utility functions
  async getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        labels (*)
      `)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date');

    if (error) throw error;
    return data || [];
  },

  async getOverdueTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        labels (*)
      `)
      .lt('due_date', new Date().toISOString())
      .neq('status', 'completed')
      .order('due_date');

    if (error) throw error;
    return data || [];
  },

  async getSnoozedTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(*),
        labels (*)
      `)
      .not('snoozed_until', 'is', null)
      .order('snoozed_until');

    if (error) throw error;
    return data || [];
  }
};

// Real-time subscriptions
export const subscribeToProjectUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('project-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe();
};

export const subscribeToTaskUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('task-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, callback)
    .subscribe();
};

export const subscribeToCommentUpdates = (callback: (payload: any) => void) => {
  return supabase
    .channel('comment-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, callback)
    .subscribe();
};
