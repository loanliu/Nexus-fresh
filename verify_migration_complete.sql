-- Verify Project Association Migration Status
-- This query checks if the migration has been completed successfully

-- 1. Check if project_id column exists in resources table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'resources' 
    AND table_schema = 'public'
    AND column_name = 'project_id';

-- 2. Check if the index on project_id exists
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'resources' 
    AND indexname LIKE '%project_id%';

-- 3. Check current RLS policies on resources table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'resources' 
    AND schemaname = 'public'
ORDER BY policyname;

-- 4. Check if resources table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE tablename = 'resources' 
    AND schemaname = 'public';

-- 5. Sample check: Look at a few resources to see if they have project_id
SELECT 
    id,
    title,
    project_id,
    user_id,
    created_at
FROM resources 
LIMIT 5;

-- 6. Check if any resources have project_id populated
SELECT 
    COUNT(*) as total_resources,
    COUNT(project_id) as resources_with_project_id,
    COUNT(*) - COUNT(project_id) as resources_without_project_id
FROM resources;

-- 7. Check project_members table structure (should exist)
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_members' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
