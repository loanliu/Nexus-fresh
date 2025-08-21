-- Fix RLS Security Issues - Safe to run
-- This script enables Row Level Security on tables that need it
-- Your existing RLS policies will work correctly once RLS is enabled

-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on tables that are missing it completely
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'admin_users', 'analytics', 'documents', 'users', 
        'google_tokens', 'google_access_tokens', 'content_embeddings', 'resource_tags'
    )
ORDER BY tablename;

-- Show existing RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
