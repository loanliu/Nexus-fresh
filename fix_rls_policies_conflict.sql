-- Fix RLS Policies Conflict on Resources Table
-- The issue is that we have conflicting policies that are preventing proper resource sharing

-- 1. First, let's drop the conflicting policies
DROP POLICY IF EXISTS "Everyone can view resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can update resources" ON resources;
DROP POLICY IF EXISTS "Authenticated users can delete resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;

-- 2. Now let's create clean, non-conflicting policies
-- SELECT policy: Users can view their own resources OR resources from projects they're members of
CREATE POLICY "resources_select_policy" ON resources
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- INSERT policy: Users can insert resources they own, and can assign to projects they're members of
CREATE POLICY "resources_insert_policy" ON resources
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND (
            project_id IS NULL 
            OR project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin')
            )
        )
    );

-- UPDATE policy: Users can update their own resources OR resources from projects they have edit permissions for
CREATE POLICY "resources_update_policy" ON resources
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin', 'editor')
            )
        )
    )
    WITH CHECK (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin', 'editor')
            )
        )
    );

-- DELETE policy: Users can delete their own resources OR resources from projects they have admin permissions for
CREATE POLICY "resources_delete_policy" ON resources
    FOR DELETE
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin')
            )
        )
    );

-- 3. Verify the policies are working correctly
-- Test query to see what the participating member should see
SELECT 
    r.id,
    r.title,
    r.project_id,
    r.user_id,
    'Should be visible to project members' as visibility_note
FROM resources r
WHERE r.project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844'
    AND (
        r.user_id = '25ffa6d3-0487-49ca-a4aa-638f205798da'::uuid
        OR (
            r.project_id IS NOT NULL 
            AND r.project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = '25ffa6d3-0487-49ca-a4aa-638f205798da'::uuid
            )
        )
    );
