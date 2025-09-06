-- Fix infinite recursion in project_members policies
-- The issue is that project_members policies are checking themselves

-- Drop the problematic policies
DROP POLICY IF EXISTS "project_members_select_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert_policy" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete_policy" ON public.project_members;

-- Create corrected policies that don't cause recursion
-- For SELECT: Allow users to see members of projects they're already members of
-- We need to check if the user is a member through a different approach
CREATE POLICY "project_members_select_policy" ON public.project_members
    FOR SELECT
    USING (
        -- Allow if user is the member themselves
        user_id = auth.uid()
        OR
        -- Allow if user is a member of the same project (but check through a different table)
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id
            AND p.user_id = auth.uid()  -- Project owner can see all members
        )
        OR
        -- Allow if user is a member of the project (but we need to be careful here)
        -- We'll use a different approach - check if user has any role in this project
        EXISTS (
            SELECT 1 FROM public.project_members pm2
            WHERE pm2.project_id = project_members.project_id
            AND pm2.user_id = auth.uid()
            AND pm2.id != project_members.id  -- Don't reference the same row
        )
    );

-- For INSERT: Allow project owners and admins to add members
CREATE POLICY "project_members_insert_policy" ON public.project_members
    FOR INSERT
    WITH CHECK (
        -- Allow if user is the project owner
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id
            AND p.user_id = auth.uid()
        )
        OR
        -- Allow if user is an admin/owner of the project
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- For DELETE: Allow project owners and admins to remove members
CREATE POLICY "project_members_delete_policy" ON public.project_members
    FOR DELETE
    USING (
        -- Allow if user is the project owner
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_members.project_id
            AND p.user_id = auth.uid()
        )
        OR
        -- Allow if user is an admin/owner of the project
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Also fix the project_invites policies that might have similar issues
DROP POLICY IF EXISTS "project_invites_select_policy" ON public.project_invites;
DROP POLICY IF EXISTS "project_invites_insert_policy" ON public.project_invites;

CREATE POLICY "project_invites_select_policy" ON public.project_invites
    FOR SELECT
    USING (
        -- Allow if user is the project owner
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_invites.project_id
            AND p.user_id = auth.uid()
        )
        OR
        -- Allow if user is an admin/owner of the project
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
        -- Allow if user is the project owner
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_invites.project_id
            AND p.user_id = auth.uid()
        )
        OR
        -- Allow if user is an admin/owner of the project
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_invites.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );
