-- Safe RLS Security Fix - Only enables RLS, no policy creation
-- This avoids column name issues and is completely safe to run

-- Step 1: Enable RLS on all tables that need it
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is enabled
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

-- Step 3: Show existing RLS policies (these should work once RLS is enabled)
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
