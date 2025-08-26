# Database Migrations

This directory contains database migrations for the Nexus project management system.

## Subtasks Migration

### File: `001_create_subtasks_table.sql`

**Purpose**: Creates a one-level subtask system for tasks with proper security policies.

**What it creates**:
- `subtasks` table with proper structure
- Performance indexes on `task_id` and `order_index`
- Row Level Security (RLS) policies
- User ownership validation through `exists()` subqueries

**How to run**:

1. **Via Supabase Dashboard**:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and paste the contents of `001_create_subtasks_table.sql`
   - Click "Run" to execute

2. **Via Supabase CLI** (if you have it installed):
   ```bash
   supabase db push
   ```

**Security Features**:
- Users can only access subtasks for tasks they own
- RLS policies enforce ownership at the database level
- Cascade deletion ensures subtasks are removed when parent tasks are deleted

**Table Structure**:
```sql
subtasks (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks(id),
  title text NOT NULL,
  done boolean DEFAULT false,
  order_index int DEFAULT 0,
  estimate_hours numeric(5,2),
  created_at timestamptz DEFAULT now()
)
```

**Indexes**:
- `idx_subtasks_task_id` - For fast lookups by parent task
- `idx_subtasks_order_index` - For sorting and ordering

**RLS Policies**:
- SELECT: Users can view subtasks for their own tasks
- INSERT: Users can create subtasks for their own tasks  
- UPDATE: Users can update subtasks for their own tasks
- DELETE: Users can delete subtasks for their own tasks
