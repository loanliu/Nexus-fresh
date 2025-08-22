-- Detailed check of the existing users table
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check the exact structure of your users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if the table has the right foreign key to auth.users
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'users';

-- 3. Check existing RLS policies on users table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'users';

-- 4. Check if there are any existing users in the table
SELECT 
    COUNT(*) as user_count
FROM public.users;

-- 5. Check if there are any users in auth.users
SELECT 
    COUNT(*) as auth_user_count
FROM auth.users;

-- 6. Check the exact error by looking at recent logs (if available)
-- This might show more details about the 500 error
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
