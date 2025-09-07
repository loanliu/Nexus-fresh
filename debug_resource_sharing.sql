-- Debug Resource Sharing Issue
-- This query helps diagnose why the participating member can't see the shared resource

-- 1. Check the specific resource that should be shared
SELECT 
    r.id,
    r.title,
    r.project_id,
    r.user_id,
    p.name as project_name,
    p.color as project_color
FROM resources r
LEFT JOIN projects p ON r.project_id = p.id
WHERE r.project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844';

-- 2. Check project members for the Leo Voice Agent project
SELECT 
    pm.user_id,
    pm.role,
    pm.status,
    pm.created_at
FROM project_members pm
WHERE pm.project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844'
ORDER BY pm.created_at;

-- 3. Check if the participating member (loanliu@yahoo.com) is in project_members
SELECT 
    pm.*,
    'loanliu@yahoo.com user_id: 25ffa6d3-0487-49ca-a4aa-638f205798da' as note
FROM project_members pm
WHERE pm.project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844'
    AND pm.user_id = '25ffa6d3-0487-49ca-a4aa-638f205798da';

-- 4. Test the RLS policy manually - simulate what the participating member should see
-- This simulates the query that should return the shared resource
SELECT 
    r.id,
    r.title,
    r.project_id,
    r.user_id,
    'Should be visible to project members' as visibility_note
FROM resources r
WHERE r.project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844'
    AND (
        r.user_id = '25ffa6d3-0487-49ca-a4aa-638f205798da'  -- Own resources
        OR 
        r.project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = '25ffa6d3-0487-49ca-a4aa-638f205798da'
        )  -- Shared project resources
    );

-- 5. Check current RLS policies on resources table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'resources' 
    AND schemaname = 'public'
ORDER BY policyname;
