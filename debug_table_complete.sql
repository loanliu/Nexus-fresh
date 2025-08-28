-- 🔍 COMPLETE DEBUG OF GOOGLE_ACCESS_TOKENS TABLE
-- Run this in your Supabase SQL Editor to see exactly what's wrong

-- ========================================
-- STEP 1: CHECK IF TABLE EXISTS
-- ========================================

SELECT 
    'TABLE EXISTENCE' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'google_access_tokens'
        ) THEN '✅ TABLE EXISTS'
        ELSE '❌ TABLE DOES NOT EXIST'
    END as table_status;

-- ========================================
-- STEP 2: CHECK TABLE STRUCTURE
-- ========================================

SELECT 
    'TABLE STRUCTURE' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN is_nullable = 'NO' THEN '❌ REQUIRED - CANNOT BE NULL'
        ELSE '✅ OPTIONAL - CAN BE NULL'
    END as constraint_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'google_access_tokens'
ORDER BY ordinal_position;

-- ========================================
-- STEP 3: CHECK RLS STATUS
-- ========================================

SELECT 
    'RLS STATUS' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens';

-- ========================================
-- STEP 4: CHECK POLICIES
-- ========================================

SELECT 
    'POLICIES' as info_type,
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN - NULL CONDITION'
        WHEN qual LIKE '%auth.email()%' THEN '✅ CORRECT - USES AUTH.EMAIL()'
        ELSE '❓ UNKNOWN POLICY LOGIC'
    END as policy_quality
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens'
ORDER BY cmd;

-- ========================================
-- STEP 5: TEST BASIC OPERATIONS
-- ========================================

-- Test 1: Can we read from the table?
SELECT 
    'READ TEST' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.google_access_tokens LIMIT 1
        ) THEN '✅ CAN READ FROM TABLE'
        ELSE '❌ CANNOT READ FROM TABLE'
    END as read_status;

-- Test 2: Can we insert a test row?
DO $$
BEGIN
    INSERT INTO public.google_access_tokens (
        user_email,
        access_token,
        refresh_token,
        expires_at
    ) VALUES (
        'test@example.com',
        'test-access-token',
        'test-refresh-token',
        NOW()
    );
    
    RAISE NOTICE '✅ TEST INSERT SUCCESSFUL';
    
    -- Clean up test data
    DELETE FROM public.google_access_tokens WHERE user_email = 'test@example.com';
    RAISE NOTICE '✅ TEST DATA CLEANED UP';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ TEST INSERT FAILED: %', SQLERRM;
END $$;

-- ========================================
-- STEP 6: CHECK FOR ANY ERRORS
-- ========================================

SELECT 
    'DEBUG COMPLETE' as status,
    NOW() as completed_at;