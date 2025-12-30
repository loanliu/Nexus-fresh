-- Fix RLS policies for tasks table to support project sharing
-- This allows project members to update tasks, not just the task owner

-- Drop existing task policies that only check user_id
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.tasks;

-- SELECT policy: Users can see tasks if:
-- 1. They own the task (user_id matches), OR
-- 2. The task belongs to a project they're a member of, OR
-- 3. The task has no project (standalone tasks)
CREATE POLICY "tasks_select_policy" ON public.tasks
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
        )
    );

-- UPDATE policy: Users can update tasks if:
-- 1. They own the task (user_id matches), OR
-- 2. The task belongs to a project they're a member of (any role)
CREATE POLICY "tasks_update_policy" ON public.tasks
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
        ))
    )
    WITH CHECK (
        user_id = auth.uid() OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
        ))
    );

-- INSERT policy: Users can create tasks if:
-- 1. They're setting user_id to their own ID, AND
-- 2. If project_id is set, they must be a member of that project
CREATE POLICY "tasks_insert_policy" ON public.tasks
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        (project_id IS NULL OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
        ))
    );

-- DELETE policy: Users can delete tasks if:
-- 1. They own the task (user_id matches), OR
-- 2. The task belongs to a project where they're an owner or admin
CREATE POLICY "tasks_delete_policy" ON public.tasks
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = tasks.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        ))
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;

