-- Fix project_members RLS policy to allow creators to add themselves
-- This fixes the issue where users can't be added as members to newly created projects

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "project_members_insert_policy" ON public.project_members;

-- Create a new policy that allows:
-- 1. Existing owners/admins to add members (as before)
-- 2. Users to add themselves as owner to projects they created
CREATE POLICY "project_members_insert_policy" ON public.project_members
    FOR INSERT
    WITH CHECK (
        -- Allow if user is adding themselves as owner to a project they created
        (user_id = auth.uid() AND role = 'owner' AND 
         EXISTS (
             SELECT 1 FROM public.projects p
             WHERE p.id = project_members.project_id
             AND p.user_id = auth.uid()
         ))
        OR
        -- Allow if user is already a member with owner/admin role
        EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

