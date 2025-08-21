-- Diagnostic script to check table structure before creating RLS policies
-- This will show us the actual column names so we can create correct policies

-- Check the structure of tables that need RLS policies
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'google_tokens', 'google_access_tokens', 
        'content_embeddings', 'resource_tags'
    )
ORDER BY table_name, ordinal_position;

-- Also check if these tables exist and their current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'users', 'google_tokens', 'google_access_tokens', 
        'content_embeddings', 'resource_tags'
    )
ORDER BY tablename;
