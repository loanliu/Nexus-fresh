-- �� FIX GOOGLE AUTHENTICATION RLS POLICIES
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: CHECK CURRENT GOOGLE TABLES STATUS
-- ========================================

-- Check if google_tokens table exists and its RLS status
SELECT 
    'GOOGLE TABLES STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('google_tokens', 'google_access_tokens')
ORDER BY tablename;

-- ========================================
-- STEP 2: CHECK EXISTING POLICIES
-- ========================================

-- See what policies exist on Google tables
SELECT 
    'EXISTING POLICIES' as info_type,
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('google_tokens', 'google_access_tokens')
ORDER BY tablename, cmd;

-- ========================================
-- STEP 3: FIX GOOGLE_TOKENS TABLE
-- ========================================

-- Enable RLS if not already enabled
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.google_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON public.google_tokens;

-- Create proper policies for google_tokens
CREATE POLICY "Users can view own tokens" ON public.google_tokens
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own tokens" ON public.google_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own tokens" ON public.google_tokens
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own tokens" ON public.google_tokens
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ========================================
-- STEP 4: FIX GOOGLE_ACCESS_TOKENS TABLE
-- ========================================

-- Enable RLS if not already enabled
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can manage own access tokens" ON public.google_access_tokens;
DROP POLICY IF EXISTS "Users can view own access tokens" ON public.google_access_tokens;
DROP POLICY IF EXISTS "Users can insert own access tokens" ON public.google_access_tokens;
DROP POLICY IF EXISTS "Users can update own access tokens" ON public.google_access_tokens;
DROP POLICY IF EXISTS "Users can delete own access tokens" ON public.google_access_tokens;

-- Create proper policies for google_access_tokens
CREATE POLICY "Users can view own access tokens" ON public.google_access_tokens
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own access tokens" ON public.google_access_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own access tokens" ON public.google_access_tokens
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own access tokens" ON public.google_access_tokens
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ========================================
-- STEP 5: VERIFY THE FIX
-- ========================================

-- Check final policy status
SELECT 
    'FINAL POLICY STATUS' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN '✅ PROPER USER CHECK'
        ELSE '⚠️ CHECK POLICY LOGIC'
    END as policy_quality
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('google_tokens', 'google_access_tokens')
ORDER BY tablename, cmd;

-- Test if users can now insert tokens
SELECT 
    'GOOGLE AUTH FIX COMPLETE' as status,
    NOW() as completed_at;