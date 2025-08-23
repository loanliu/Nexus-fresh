-- Aggressive fix for admin_users infinite recursion
-- This completely disables RLS on admin_users table to stop the recursion

-- First, let's see what we're dealing with
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Step 1: Drop ALL policies on admin_users table
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Authenticated users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can delete admin_users" ON public.admin_users;

-- Step 2: Completely disable RLS on admin_users table
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Step 4: Verify no policies exist
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- This is a temporary fix to stop the infinite recursion
-- You can re-enable RLS later with proper non-recursive policies
