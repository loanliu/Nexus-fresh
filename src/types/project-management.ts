// Project Management Types
// Unified types for the project management system

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Computed fields
  tasks?: Task[];
  progress?: number; // calculated from completed tasks
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  effort: number; // effort points (1-5 scale)
  project_id?: string;
  parent_task_id?: string; // for subtasks
  sort_order: number;
  snoozed_until?: string; // for snooze functionality
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_id: string;
  // Computed fields
  labels?: Label[];
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  project?: Project;
  dependencies?: Task[]; // tasks that must be completed first
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  done: boolean;
  order_index: number;
  estimate_hours?: number;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
  user_id: string;
}

export interface Comment {
  id: string;
  content: string;
  task_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Attachment {
  id: string;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  task_id: string;
  created_at: string;
  user_id: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimated_duration: number; // days
  template_data: TemplateData;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface TemplateData {
  tasks: TemplateTask[];
  labels?: string[];
  description?: string;
}

export interface TemplateTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  effort: number;
  estimated_hours?: number;
  labels?: string[];
}

export interface DailyDigestSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  channels: string[]; // email, slack, telegram
  webhook_url?: string; // n8n webhook URL
  digest_time: string; // HH:MM format
  sections: string[]; // due_today, at_risk, needs_decision, blocked, idle_tasks
  idle_task_threshold: number; // days
  created_at: string;
  updated_at: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filter_config: FilterConfig;
  is_default: boolean;
  created_at: string;
  user_id: string;
}

export interface FilterConfig {
  status?: string[];
  priority?: string[];
  project_id?: string[];
  labels?: string[];
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
  effort_min?: number;
  effort_max?: number;
  is_overdue?: boolean;
  is_snoozed?: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  effort: number;
  project_id?: string;
  parent_task_id?: string;
  label_ids?: string[];
}

export interface CreateTaskData extends TaskFormData {
  label_ids?: string[];
  user_id: string;
}

export interface UpdateTaskData extends Partial<TaskFormData> {
  id: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  color: string;
}

export interface CreateProjectData extends ProjectFormData {
  user_id: string;
}

export interface UpdateProjectData extends Partial<ProjectFormData> {
  id: string;
}

export interface WeeklyCapacity {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface WeeklyPlan {
  week_start: string; // ISO date string
  capacity: WeeklyCapacity;
  tasks: PlannedTask[];
  overloads: DayOverload[];
}

export interface PlannedTask {
  task_id: string;
  planned_date: string; // ISO date string
  day_of_week: string; // monday, tuesday, etc.
  estimated_hours: number;
}

export interface DayOverload {
  date: string;
  day_of_week: string;
  overload_hours: number;
  tasks: string[]; // task IDs that could be moved
}

export interface DailyDigest {
  date: string;
  due_today: Task[];
  at_risk: Task[];
  needs_decision: Task[];
  blocked: Task[];
  idle_tasks: Task[];
  summary: {
    total_tasks: number;
    completed_today: number;
    overdue: number;
    due_this_week: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form validation schemas (for Zod)
export const taskStatusOptions = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const taskPriorityOptions = ['low', 'medium', 'high', 'urgent'] as const;
export const projectStatusOptions = ['active', 'completed', 'on_hold', 'cancelled'] as const;
export const effortOptions = [1, 2, 3, 4, 5] as const;

export interface CreateProjectTemplateData {
  name: string;
  description?: string;
  category?: string;
  estimated_duration?: number;
  complexity: 'simple' | 'moderate' | 'complex';
  tasks: TemplateTask[];
  user_id: string;
}

export interface UpdateProjectTemplateData extends Partial<CreateProjectTemplateData> {
  id: string;
}
