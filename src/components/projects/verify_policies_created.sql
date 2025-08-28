-- 🔍 VERIFY POLICIES WERE CREATED CORRECTLY
-- Run this to confirm the policies exist

-- Check that RLS is enabled
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

-- Check that policies exist
SELECT 
    'POLICY STATUS' as check_type,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens'
ORDER BY cmd;

-- Check the policy logic (this will show the actual policy definitions)
SELECT 
    'POLICY DEFINITIONS' as info_type,
    policyname,
    cmd as operation,
    qual as policy_condition,
    CASE 
        WHEN qual LIKE '%auth.email()%' THEN '✅ CORRECT - USES AUTH.EMAIL()'
        WHEN qual LIKE '%auth.uid()%' THEN '⚠️ USES AUTH.UID()'
        ELSE '❓ UNKNOWN POLICY LOGIC'
    END as policy_quality
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens'
ORDER BY cmd;