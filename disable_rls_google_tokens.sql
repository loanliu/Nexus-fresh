-- Temporarily disable RLS on google_tokens table to test if that's the issue
ALTER TABLE google_tokens DISABLE ROW LEVEL SECURITY;

-- Check if RLS is now disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_tokens';

-- Also check if there are any policies that might be interfering
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
WHERE tablename = 'google_tokens';
