export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          parent_category_id: string | null
          created_at: string
          updated_at: string
          user_id: string
          is_default: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color: string
          icon: string
          parent_category_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
          is_default?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          parent_category_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
          is_default?: boolean
          sort_order?: number
        }
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          content: string | null
          category_id: string
          subcategory: string | null
          tags: string[]
          file_url: string | null
          file_type: string | null
          file_size: number | null
          created_at: string
          updated_at: string
          search_vector: string | null
          user_id: string
          is_favorite: boolean
          notes: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          content?: string | null
          category_id: string
          subcategory?: string | null
          tags?: string[]
          file_url?: string | null
          file_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
          search_vector?: string | null
          user_id: string
          is_favorite?: boolean
          notes?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          content?: string | null
          category_id?: string
          subcategory?: string | null
          tags?: string[]
          file_url?: string | null
          file_type?: string | null
          file_size?: number | null
          created_at?: string
          updated_at?: string
          search_vector?: string | null
          user_id?: string
          is_favorite?: boolean
          notes?: string | null
          metadata?: Json | null
        }
      }
      api_keys: {
        Row: {
          id: string
          service_name: string
          key_name: string
          encrypted_key: string
          setup_instructions: string | null
          category_id: string | null
          expiration_date: string | null
          last_tested: string | null
          status: string
          user_id: string
          created_at: string
          updated_at: string
          notes: string | null
          usage_limits: Json | null
        }
        Insert: {
          id?: string
          service_name: string
          key_name: string
          encrypted_key: string
          setup_instructions?: string | null
          category_id?: string | null
          expiration_date?: string | null
          last_tested?: string | null
          status?: string
          user_id: string
          created_at?: string
          updated_at?: string
          notes?: string | null
          usage_limits?: Json | null
        }
        Update: {
          id?: string
          service_name?: string
          key_name?: string
          encrypted_key?: string
          setup_instructions?: string | null
          category_id?: string | null
          expiration_date?: string | null
          last_tested?: string | null
          status?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          notes?: string | null
          usage_limits?: Json | null
        }
      }
      checklists: {
        Row: {
          id: string
          name: string
          service_type: string
          template_items: Json
          created_at: string
          updated_at: string
          user_id: string
          is_template: boolean
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          service_type: string
          template_items: Json
          created_at?: string
          updated_at?: string
          user_id: string
          is_template?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          service_type?: string
          template_items?: Json
          created_at?: string
          updated_at?: string
          user_id?: string
          is_template?: boolean
          description?: string | null
        }
      }
      client_projects: {
        Row: {
          id: string
          client_name: string
          service_type: string
          checklist_id: string
          current_step: number
          completed_items: string[]
          notes: string | null
          created_at: string
          updated_at: string
          user_id: string
          status: string
          priority: string
          due_date: string | null
          budget: number | null
          contact_info: Json | null
        }
        Insert: {
          id?: string
          client_name: string
          service_type: string
          checklist_id: string
          current_step?: number
          completed_items?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
          status?: string
          priority?: string
          due_date?: string | null
          budget?: number | null
          contact_info?: Json | null
        }
        Update: {
          id?: string
          client_name?: string
          service_type?: string
          checklist_id?: string
          current_step?: number
          completed_items?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
          status?: string
          priority?: string
          due_date?: string | null
          budget?: number | null
          contact_info?: Json | null
        }
      }
      tasks: {
        Row: {
          id: string
          resource_id: string | null
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          category: string
          auto_generated: boolean
          user_id: string
          created_at: string
          updated_at: string
          completed_at: string | null
          estimated_time: number | null
          actual_time: number | null
          tags: string[]
          dependencies: string[]
          assigned_to: string | null
        }
        Insert: {
          id?: string
          resource_id?: string | null
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          category: string
          auto_generated?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          estimated_time?: number | null
          actual_time?: number | null
          tags?: string[]
          dependencies?: string[]
          assigned_to?: string | null
        }
        Update: {
          id?: string
          resource_id?: string | null
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          category?: string
          auto_generated?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          estimated_time?: number | null
          actual_time?: number | null
          tags?: string[]
          dependencies?: string[]
          assigned_to?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
          action_url: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          created_at?: string
          action_url?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
          action_url?: string | null
          metadata?: Json | null
        }
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json
          results_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          filters: Json
          results_count: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          filters?: Json
          results_count?: number
          created_at?: string
        }
      }
      saved_searches: {
        Row: {
          id: string
          user_id: string
          name: string
          query: string
          filters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          query: string
          filters: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          query?: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
