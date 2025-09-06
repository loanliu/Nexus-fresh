# Project Sharing Migration Guide

## Phase 1: Database Schema & RLS Setup

### Files
- `003_project_sharing_schema.sql` - Main migration file

### How to Apply in Supabase

1. **Open Supabase Dashboard**
   - Go to your project at [supabase.com](https://supabase.com)
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Copy the entire contents of `003_project_sharing_schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('project_members', 'project_invites');
   ```

4. **Verify RLS is Enabled**
   ```sql
   -- Check RLS status
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('projects', 'tasks', 'project_members', 'project_invites');
   ```

### What This Migration Creates

#### Tables
- **`project_members`**: Links users to projects with roles (owner/admin/editor/viewer)
- **`project_invites`**: Manages email invitations to projects

#### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Least-privilege policies** using `auth.uid()`
- **Role-based access control** (owner/admin can manage members)
- **Unique constraints** prevent duplicate pending invites

#### Indexes
- Performance indexes on frequently queried columns
- Unique constraint for pending invites per project/email

### Next Steps
After applying this migration, you'll be ready for Phase 2: Frontend components for project sharing!
