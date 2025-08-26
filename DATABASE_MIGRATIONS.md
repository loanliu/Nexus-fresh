# Database Migrations

This document tracks all database schema changes for the Nexus project management system.

## Migration 001: Create Subtasks Table

**File**: `migrations/001_create_subtasks_table.sql`

**Purpose**: Creates the initial subtasks table with basic structure and RLS policies.

**Changes**:
- Creates `subtasks` table with columns: `id`, `task_id`, `title`, `done`, `order_index`, `estimate_hours`, `created_at`
- Establishes foreign key relationship with `tasks` table
- Implements Row Level Security (RLS) policies
- Creates performance indexes

**Tables Created**:
- `subtasks` - One-level subtasks for tasks

**Security**:
- RLS enabled with policies ensuring users can only access subtasks for their own tasks
- All CRUD operations protected by ownership checks

**To Apply**:
```sql
-- Run this in your Supabase SQL Editor
\i migrations/001_create_subtasks_table.sql
```

## Migration 002: Add Status Column to Subtasks

**File**: `migrations/002_add_status_to_subtasks.sql`

**Purpose**: Adds a status field to track subtask completion progress.

**Changes**:
- Adds `status` column with default value 'pending'
- Sets existing subtasks to 'pending' status
- Makes status column NOT NULL
- Adds check constraint for valid status values: 'pending', 'in_progress', 'completed', 'cancelled'

**Columns Added**:
- `status` - Text field for subtask status tracking

**To Apply**:
```sql
-- Run this in your Supabase SQL Editor
\i migrations/002_add_status_to_subtasks.sql
```
