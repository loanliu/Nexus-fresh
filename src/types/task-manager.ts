// Task Manager MVP Types
// Phase 1: Core Entity Interfaces

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
  user_id: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  project_id?: string;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_id: string;
  // Computed fields
  labels?: Label[];
  subtasks?: Task[];
  comments?: Comment[];
  attachments?: Attachment[];
  project?: Project;
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
  assigned_to?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_hours?: number;
  project_id?: string;
  parent_task_id?: string;
  // label_ids is handled separately through the task_labels junction table
}

export interface CreateTaskData extends TaskFormData {
  label_ids?: string[];
}

export interface ProjectFormData {
  name: string;
  description?: string;
  color: string;
}

export interface LabelFormData {
  name: string;
  color: string;
}

export interface CommentFormData {
  content: string;
  task_id: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  hasMore: boolean;
}

// Task status options
export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-600' }
] as const;

// Priority options
export const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
] as const;

// Default colors for projects
export const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#EC4899'  // pink
];

// Default colors for labels
export const LABEL_COLORS = [
  '#6B7280', // gray
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316'  // orange
];
