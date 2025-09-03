-- 🔒 FORCE SECURITY FIXES - TARGETED APPROACH
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: FORCE ENABLE RLS ON ADMIN_USERS
-- ========================================

-- First, let's see what's preventing RLS from being enabled
SELECT 
    'CURRENT ADMIN_USERS STATE' as info_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'admin_users';

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Authenticated users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- Now force enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create a simple, safe policy
CREATE POLICY "Authenticated users can view admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create policy for admin management using the function
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
    FOR ALL USING (
        auth.uid() IS NOT NULL AND is_user_admin(auth.uid())
    );

-- ========================================
-- STEP 2: FORCE REMOVE SEARCH_DOCUMENTS VIEW
-- ========================================

-- Check what's in the view first
SELECT 
    'SEARCH_DOCUMENTS VIEW INFO' as info_type,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname = 'search_documents';

-- Force drop the view and any dependencies
DROP VIEW IF EXISTS public.search_documents CASCADE;

-- ========================================
-- STEP 3: VERIFY THE FIXES
-- ========================================

-- Check admin_users RLS status
SELECT 
    'ADMIN_USERS RLS STATUS' as info_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'admin_users';

-- Check if search_documents view is gone
SELECT 
    'SEARCH_DOCUMENTS VIEW CHECK' as info_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
                AND viewname = 'search_documents'
        ) THEN '❌ View still exists'
        ELSE '✅ View removed'
    END as status;

-- Check policies on admin_users
SELECT 
    'ADMIN_USERS POLICIES' as info_type,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- ========================================
-- STEP 4: FINAL SUMMARY
-- ========================================

SELECT 
    'FINAL SUMMARY' as info_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
                AND tablename = 'admin_users' 
                AND rowsecurity = true
        ) THEN '✅ RLS enabled on admin_users'
        ELSE '❌ RLS still disabled on admin_users'
    END as admin_users_rls_status,
    
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_views 
            WHERE schemaname = 'public' 
                AND viewname = 'search_documents'
        ) THEN '✅ search_documents view removed'
        ELSE '❌ search_documents view still exists'
    END as search_documents_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'is_user_admin'
        ) THEN '✅ is_user_admin function exists'
        ELSE '❌ is_user_admin function missing'
    END as admin_function_status;
