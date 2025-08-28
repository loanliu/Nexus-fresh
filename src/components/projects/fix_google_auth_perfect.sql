-- 🔒 PERFECT FIX FOR YOUR GOOGLE_ACCESS_TOKENS TABLE
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: ENABLE RLS ON GOOGLE_ACCESS_TOKENS
-- ========================================

-- Enable RLS on google_access_tokens
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: CREATE PRECISE RLS POLICIES
-- ========================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users" ON public.google_access_tokens;
DROP POLICY IF EXISTS "Users manage own tokens" ON public.google_access_tokens;

-- Create policy for SELECT - users can only see their own tokens
CREATE POLICY "Users can view own tokens" ON public.google_access_tokens
    FOR SELECT USING (auth.email() = user_email);

-- Create policy for INSERT - users can only insert tokens for their own email
CREATE POLICY "Users can insert own tokens" ON public.google_access_tokens
    FOR INSERT WITH CHECK (auth.email() = user_email);

-- Create policy for UPDATE - users can only update their own tokens
CREATE POLICY "Users can update own tokens" ON public.google_access_tokens
    FOR UPDATE USING (auth.email() = user_email);

-- Create policy for DELETE - users can only delete their own tokens
CREATE POLICY "Users can delete own tokens" ON public.google_access_tokens
    FOR DELETE USING (auth.email() = user_email);

-- ========================================
-- STEP 3: CHECK GOOGLE_TOKENS TABLE TOO
-- ========================================

-- Let's also check if google_tokens table exists and fix it
-- First, check if it exists
SELECT 
    'GOOGLE_TOKENS EXISTS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'google_tokens'
        ) THEN '✅ TABLE EXISTS'
        ELSE '❌ TABLE DOES NOT EXIST'
    END as table_status;

-- If google_tokens exists, let's see its structure too
SELECT 
    'GOOGLE_TOKENS COLUMNS' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'google_tokens'
ORDER BY ordinal_position;

-- ========================================
-- STEP 4: VERIFY THE FIX
-- ========================================

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

-- Test the policy logic
SELECT 
    'POLICY TEST' as test_type,
    CASE 
        WHEN auth.email() IS NOT NULL THEN '✅ USER EMAIL AVAILABLE'
        ELSE '❌ USER EMAIL NOT AVAILABLE'
    END as email_status,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ USER ID AVAILABLE'
        ELSE '❌ USER ID NOT AVAILABLE'
    END as uid_status;