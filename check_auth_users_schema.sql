-- Check the structure of auth.users table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Also check what data is actually in the auth.users table for our test users
SELECT 
  id,
  email,
  raw_user_meta_data,
  user_metadata,
  app_metadata,
  created_at
FROM auth.users 
WHERE id IN ('a8ad4586-7170-4116-a224-cdd112e4d3d2', '1895c44b-205a-4537-aaa2-472953e4cc2a')
LIMIT 5;
