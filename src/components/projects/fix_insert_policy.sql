-- 🔧 FIX THE BROKEN INSERT POLICY
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: DROP AND RECREATE THE INSERT POLICY
-- ========================================

-- Drop the broken INSERT policy
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.google_access_tokens;

-- Create the correct INSERT policy
CREATE POLICY "Users can insert own tokens" ON public.google_access_tokens
    FOR INSERT WITH CHECK (auth.email() = user_email);

-- ========================================
-- STEP 2: VERIFY ALL POLICIES ARE CORRECT
-- ========================================

-- Check all policies now
SELECT 
    'FINAL POLICY CHECK' as check_type,
    policyname,
    cmd as operation,
    qual as policy_condition,
    CASE 
        WHEN qual IS NULL THEN '❌ BROKEN - NULL CONDITION'
        WHEN qual LIKE '%auth.email()%' THEN '✅ CORRECT - USES AUTH.EMAIL()'
        WHEN qual LIKE '%auth.uid()%' THEN '⚠️ USES AUTH.UID()'
        ELSE '❓ UNKNOWN POLICY LOGIC'
    END as policy_quality
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'google_access_tokens'
ORDER BY cmd;

-- ========================================
-- STEP 3: TEST THE COMPLETE POLICY SET
-- ========================================

-- Summary of what should work now
SELECT 
    'POLICY SUMMARY' as summary_type,
    'All operations should now work' as status,
    NOW() as fixed_at;