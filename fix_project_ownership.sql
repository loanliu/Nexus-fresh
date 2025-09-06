-- Fix project ownership by adding user as owner of all existing projects
-- This script will add the user as 'owner' of all projects they created

-- First, let's see what projects exist
SELECT 'Current projects:' as info;
SELECT id, name, created_at 
FROM projects 
ORDER BY created_at;

-- Let's see what project memberships exist
SELECT 'Current project members:' as info;
SELECT project_id, user_id, role, joined_at 
FROM project_members 
ORDER BY joined_at;

-- Add the user as owner of all projects they created
-- Replace 'a8ad4586-7170-4116-a224-cdd112e4d3d2' with your actual user ID
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
    p.id as project_id,
    'a8ad4586-7170-4116-a224-cdd112e4d3d2' as user_id,  -- Your user ID
    'owner' as role,
    p.created_at as joined_at
FROM projects p
WHERE p.id NOT IN (
    SELECT project_id 
    FROM project_members 
    WHERE user_id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2'
);

-- Show the results
SELECT 'Added ownership records:' as info;
SELECT project_id, user_id, role, joined_at 
FROM project_members 
WHERE user_id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2'
ORDER BY joined_at;

-- Count how many projects you now own
SELECT 'Summary:' as info;
SELECT 
    COUNT(*) as total_projects_owned,
    COUNT(CASE WHEN role = 'owner' THEN 1 END) as owner_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM project_members 
WHERE user_id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2';
