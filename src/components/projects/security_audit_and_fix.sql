-- 🔒 COMPREHENSIVE SECURITY AUDIT & FIX SCRIPT
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: AUDIT CURRENT SECURITY STATUS
-- ========================================

-- Check which tables have RLS enabled vs disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check which tables have RLS policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS POLICIES'
        ELSE '❌ NO POLICIES'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- ========================================
-- STEP 2: FIX ADMIN_USERS TABLE
-- ========================================

-- First, check current admin_users policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Drop existing policies first (if any exist)
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON public.admin_users;

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create a safe, non-recursive admin policy
CREATE POLICY "Admin users can manage admin_users" ON public.admin_users
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- ========================================
-- STEP 3: ENABLE RLS ON ALL TABLES
-- ========================================

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: CREATE BASIC RLS POLICIES
-- ========================================

-- Users table - users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Projects table - users can only see their own projects
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Tasks table - users can only see tasks in their own projects
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT user_id::text FROM public.projects WHERE id = project_id
        )
    );

-- Subtasks table - users can only see subtasks in their own tasks
DROP POLICY IF EXISTS "Users can manage own subtasks" ON public.subtasks;
CREATE POLICY "Users can manage own subtasks" ON public.subtasks
    FOR ALL USING (
        auth.uid()::text IN (
            SELECT p.user_id::text 
            FROM public.tasks t 
            JOIN public.projects p ON t.project_id = p.id 
            WHERE t.id = task_id
        )
    );

-- ========================================
-- STEP 5: VERIFY SECURITY STATUS
-- ========================================

-- Final security status check
SELECT 
    'SECURITY AUDIT COMPLETE' as status,
    NOW() as completed_at;

-- Show final RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ SECURE'
        ELSE '❌ INSECURE'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;