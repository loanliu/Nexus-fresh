-- Verify that the project ID exists in both projects and project_members tables
-- Project ID: 7d744fa7-d228-466e-87b0-27d19ac7c844

-- Check if project exists in projects table
SELECT 
    'projects' as table_name,
    id,
    name,
    description,
    created_at,
    updated_at
FROM projects 
WHERE id = '7d744fa7-d228-466e-87b0-27d19ac7c844';

-- Check if project exists in project_members table
SELECT 
    'project_members' as table_name,
    project_id,
    user_id,
    role,
    joined_at
FROM project_members 
WHERE project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844';

-- Join both tables to see the relationship
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.description,
    p.created_at as project_created,
    pm.user_id,
    pm.role,
    pm.joined_at
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id
WHERE p.id = '7d744fa7-d228-466e-87b0-27d19ac7c844';

-- Count total projects and memberships
SELECT 
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM project_members) as total_memberships,
    (SELECT COUNT(*) FROM projects WHERE id = '7d744fa7-d228-466e-87b0-27d19ac7c844') as project_exists,
    (SELECT COUNT(*) FROM project_members WHERE project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844') as membership_exists;
