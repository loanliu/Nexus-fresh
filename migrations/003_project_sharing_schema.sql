-- Migration: Project Sharing Schema & RLS
-- Phase 1: Create project_members, project_invites tables with RLS policies
-- Date: 2025-01-27

-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- Create project_invites table
CREATE TABLE IF NOT EXISTS public.project_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
    token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    inserted_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_project_id ON public.project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_email ON public.project_invites(email);
CREATE INDEX IF NOT EXISTS idx_project_invites_token ON public.project_invites(token);
CREATE INDEX IF NOT EXISTS idx_project_invites_status ON public.project_invites(status);

-- Create unique constraint for pending invites per project/email
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_invites_unique_pending 
ON public.project_invites(project_id, email) 
WHERE status = 'pending';

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "project_members_select_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_invites_select_policy" ON public.project_invites;
DROP POLICY IF EXISTS "project_invites_insert_policy" ON public.project_invites;

-- RLS Policies for projects table
CREATE POLICY "projects_select_policy" ON public.projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "projects_update_policy" ON public.projects
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for tasks table
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT
    USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- RLS Policies for project_members table
CREATE POLICY "project_members_select_policy" ON public.project_members
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "project_members_insert_policy" ON public.project_members
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "project_members_delete_policy" ON public.project_members
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- RLS Policies for project_invites table
CREATE POLICY "project_invites_select_policy" ON public.project_invites
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_invites.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "project_invites_insert_policy" ON public.project_invites
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_invites.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
