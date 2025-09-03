-- 🔍 VERIFY SECURITY FIXES - CHECK IF THEY WORKED
-- Run this in your Supabase SQL Editor to verify the fixes

-- ========================================
-- STEP 1: CHECK ADMIN_USERS RLS STATUS
-- ========================================

-- Check if RLS is now enabled on admin_users
SELECT 
    'ADMIN_USERS RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'admin_users';

-- Check what policies exist on admin_users
SELECT 
    'ADMIN_USERS POLICIES' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- ========================================
-- STEP 2: CHECK IF SEARCH_DOCUMENTS VIEW EXISTS
-- ========================================

-- Check if search_documents view still exists
SELECT 
    'SEARCH_DOCUMENTS VIEW' as check_type,
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname = 'search_documents';

-- ========================================
-- STEP 3: TEST THE ADMIN FUNCTION
-- ========================================

-- Test if the is_user_admin function works
SELECT 
    'ADMIN FUNCTION TEST' as check_type,
    auth.uid() as current_user_id,
    is_user_admin(auth.uid()) as is_admin;

-- ========================================
-- STEP 4: CHECK ALL PUBLIC TABLES WITH RLS
-- ========================================

-- Check RLS status on all public tables
SELECT 
    'ALL PUBLIC TABLES RLS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ========================================
-- STEP 5: SUMMARY
-- ========================================

SELECT 
    'SUMMARY' as check_type,
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
        ) THEN '✅ is_user_admin function created'
        ELSE '❌ is_user_admin function missing'
    END as admin_function_status;
