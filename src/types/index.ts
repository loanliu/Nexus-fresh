// Core Resource Types
export interface Resource {
  id: string;
  title: string;
  description?: string;
  content?: string;
  category_id: string;
  subcategory_id?: string;
  project_id?: string;
  tags: string[];
  file_url?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
  search_vector?: string;
  user_id: string;
  is_favorite: boolean;
  notes?: string;
  metadata?: Record<string, any>;
  // Computed fields
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  parent_category_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_default: boolean;
  sort_order: number;
  // Categories are shared through tasks, not directly assigned to projects
  shared_in_projects?: string[]; // Array of project names that use this category
}

// Subcategory Types
export interface Subcategory {
  id: string;
  name: string;
  description?: string;
  category_id: string;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  sort_order: number;
}

// Tag Types
export interface Tag {
  id: string;
  name: string;
  description?: string;
  category_id?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// API Key Types
export interface ApiKey {
  id: string;
  service_name: string;
  key_name: string;
  encrypted_key: string;
  setup_instructions?: string;
  category_id?: string;
  expiration_date?: string;
  last_tested?: string;
  status: 'active' | 'expired' | 'invalid' | 'testing';
  user_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  usage_limits?: {
    daily?: number;
    monthly?: number;
    total?: number;
  };
}

// Checklist Types
export interface Checklist {
  id: string;
  name: string;
  service_type: ServiceType;
  template_items: ChecklistItem[];
  created_at: string;
  updated_at: string;
  user_id: string;
  is_template: boolean;
  description?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  is_required: boolean;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  sort_order: number;
  category?: string;
  estimated_time?: number; // in minutes
  dependencies?: string[]; // IDs of items that must be completed first
}

// Client Project Types
export interface ClientProject {
  id: string;
  client_name: string;
  service_type: ServiceType;
  checklist_id: string;
  current_step: number;
  completed_items: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: 'planning' | 'in_progress' | 'testing' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  budget?: number;
  contact_info?: {
    email?: string;
    phone?: string;
    company?: string;
  };
}

// Task Types
export interface Task {
  id: string;
  resource_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  category: string;
  auto_generated: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  estimated_time?: number;
  actual_time?: number;
  tags: string[];
  dependencies?: string[];
  assigned_to?: string;
}

// Service Types
export type ServiceType = 
  | 'voice_agent'
  | 'n8n_automation'
  | 'chatbot_telegram'
  | 'chatbot_whatsapp'
  | 'ai_tools'
  | 'seo'
  | 'crm'
  | 'custom';

// File Upload Types
export interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  resource_id?: string;
}

// Search Types
export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  file_types?: string[];
  date_range?: {
    start: string;
    end: string;
  };
  status?: string[];
  priority?: string[];
}

export interface SearchResult {
  resource: Resource;
  relevance_score: number;
  matched_fields: string[];
  highlights: string[];
}

// User Types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    default_view: 'grid' | 'list' | 'kanban';
    notifications: {
      email: boolean;
      push: boolean;
      in_app: boolean;
    };
  };
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

// Analytics Types
export interface Analytics {
  total_resources: number;
  total_projects: number;
  total_tasks: number;
  resources_by_category: Record<string, number>;
  recent_activity: {
    type: string;
    description: string;
    timestamp: string;
    resource_id?: string;
  }[];
  storage_usage: {
    used: number;
    limit: number;
    percentage: number;
  };
}

// Form Types
export interface ResourceFormData {
  title: string;
  description?: string;
  category_id: string;
  subcategory_id?: string;
  project_id?: string;
  tags: string[];
  notes?: string;
  file?: File;
}

export interface ProjectFormData {
  client_name: string;
  service_type: ServiceType;
  checklist_id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  budget?: number;
  notes?: string;
  contact_info?: {
    email?: string;
    phone?: string;
    company?: string;
  };
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Utility Types
export type SortDirection = 'asc' | 'desc';
export type SortField = 'title' | 'created_at' | 'updated_at' | 'priority' | 'status';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  limit: number;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password' | 'number' | 'url';
  className?: string;
}
