-- Comprehensive RLS Security Fix - Safe to run
-- This script enables RLS and creates basic policies where needed

-- Step 1: Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- Step 2: Create basic RLS policies for tables that might not have them
-- Users table - basic policy (with proper type casting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid()::text = id::text);
        
        CREATE POLICY "Users can update own profile" ON public.users
            FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- Google tokens table - basic policy (with proper type casting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_tokens' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage own tokens" ON public.google_tokens
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Google access tokens table - basic policy (with proper type casting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'google_access_tokens' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage own access tokens" ON public.google_access_tokens
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Content embeddings table - basic policy (with proper type casting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_embeddings' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage own embeddings" ON public.content_embeddings
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Resource tags table - basic policy (with proper type casting)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'resource_tags' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Users can manage own resource tags" ON public.resource_tags
            FOR ALL USING (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- Step 3: Verify all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'admin_users', 'analytics', 'documents', 'users', 
        'google_tokens', 'google_access_tokens', 'content_embeddings', 'resource_tags'
    )
ORDER BY tablename;

-- Step 4: Show all RLS policies
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
