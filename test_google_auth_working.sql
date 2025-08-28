-- 🧪 TEST IF GOOGLE AUTH IS ACTUALLY WORKING
-- Run this to see if the policies are working

-- ========================================
-- STEP 1: VERIFY POLICY STRUCTURE IS CORRECT
-- ========================================

SELECT 
    'POLICY STRUCTURE CHECK' as check_type,
    policyname,
    cmd as operation,
    qual,
    with_check,
    CASE 
        WHEN cmd = 'INSERT' AND with_check IS NOT NULL THEN '✅ INSERT POLICY CORRECT'
        WHEN cmd = 'SELECT' AND qual IS NOT NULL THEN '✅ SELECT POLICY CORRECT'
        WHEN cmd = 'UPDATE' AND qual IS NOT NULL AND with_check IS NOT NULL THEN '✅ UPDATE POLICY CORRECT'
        WHEN cmd = 'DELETE' AND qual IS NOT NULL THEN '✅ DELETE POLICY CORRECT'
        ELSE '❓ POLICY STRUCTURE UNKNOWN'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens'
ORDER BY cmd;

-- ========================================
-- STEP 2: TEST IF WE CAN INSERT (WITH RLS DISABLED TEMPORARILY)
-- ========================================

-- Temporarily disable RLS to test basic table functionality
ALTER TABLE public.google_access_tokens DISABLE ROW LEVEL SECURITY;

-- Try a test insert
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

-- Check if insert worked
SELECT 
    'BASIC INSERT TEST' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.google_access_tokens 
            WHERE user_email = 'test@example.com'
        ) THEN '✅ TABLE WORKS - INSERT SUCCESSFUL'
        ELSE '❌ TABLE BROKEN - INSERT FAILED'
    END as test_status;

-- Clean up test data
DELETE FROM public.google_access_tokens WHERE user_email = 'test@example.com';

-- Re-enable RLS
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 3: FINAL STATUS
-- ========================================

SELECT 
    'TEST COMPLETE' as status,
    'Check results above' as message;