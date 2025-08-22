-- Diagnostic script to check user creation issues
-- Run this in your Supabase SQL editor to see what's happening

-- Check if the users table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'users';

-- Check if the users table has the right structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if RLS is enabled on users table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'users';

-- Check existing RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'users';

-- Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user';

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table = 'users';

-- Check auth.users table structure (this should exist by default)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Check if there are any existing users in auth.users
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
LIMIT 5;
