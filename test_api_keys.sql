-- Test API Keys Table Structure
-- Run this in your Supabase SQL Editor to diagnose the issue

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'api_keys'
);

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'api_keys';

-- Test simple query
SELECT COUNT(*) FROM api_keys LIMIT 1;

-- Check if user exists in auth.users
SELECT id, email FROM auth.users LIMIT 5;
