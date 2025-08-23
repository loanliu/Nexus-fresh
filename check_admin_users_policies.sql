-- Check what policies actually exist on admin_users table
-- This will help us see what's causing the infinite recursion

-- First, let's see ALL policies on admin_users table
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
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Also check if RLS is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Check if there are any triggers that might be causing issues
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'admin_users'
    AND trigger_schema = 'public';
