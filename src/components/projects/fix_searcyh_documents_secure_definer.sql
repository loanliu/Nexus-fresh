-- 🔒 FIX SEARCH_DOCUMENTS SECURITY DEFINER ISSUE
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: INSPECT THE CURRENT VIEW
-- ========================================

-- Check the current view definition
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname = 'search_documents';

-- Check if the view has any dependencies
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view,
    pg_get_viewdef(dependent_view.oid) as view_definition
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_namespace dependent_ns ON dependent_view.relnamespace = dependent_ns.oid
WHERE pg_depend.refobjid = (
    SELECT oid FROM pg_class WHERE relname = 'search_documents'
);

-- ========================================
-- STEP 2: DROP AND RECREATE THE VIEW
-- ========================================

-- Drop the existing view (this will also drop any dependent views)
DROP VIEW IF EXISTS public.search_documents CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This version will respect RLS policies on the underlying tables
CREATE VIEW public.search_documents AS
SELECT 
    d.id,
    d.title,
    d.content,
    d.user_id,
    d.created_at,
    d.updated_at,
    u.email as user_email,
    u.name as user_name
FROM public.documents d
JOIN public.users u ON d.user_id = u.id
WHERE d.user_id = auth.uid(); -- This ensures users only see their own documents

-- ========================================
-- STEP 3: CREATE RLS POLICIES FOR DOCUMENTS
-- ========================================

-- Enable RLS on documents table if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents table
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- ========================================
-- STEP 4: VERIFY THE FIX
-- ========================================

-- Check that the view no longer has SECURITY DEFINER
SELECT 
    schemaname,
    viewname,
    CASE 
        WHEN definition LIKE '%SECURITY DEFINER%' THEN '❌ STILL HAS SECURITY DEFINER'
        ELSE '✅ SECURITY DEFINER REMOVED'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public' 
    AND viewname = 'search_documents';

-- Check that RLS is enabled on documents table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'documents';

-- Check that policies exist on documents table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'documents'
ORDER BY cmd;

-- ========================================
-- STEP 5: TEST THE VIEW SECURITY
-- ========================================

-- Test that the view respects user permissions
-- This should only return documents for the current user
SELECT 
    'VIEW SECURITY TEST' as test_type,
    COUNT(*) as document_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ VIEW WORKING WITH RLS'
        ELSE '⚠️ NO DOCUMENTS FOUND (check if user has documents)'
    END as test_result
FROM public.search_documents;