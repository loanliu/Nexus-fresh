-- Check current RLS policies on google_tokens table
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

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_tokens';

-- Create a simple RLS policy that allows authenticated users to insert their own tokens
-- First, drop any existing policies
DROP POLICY IF EXISTS "Users can insert their own google tokens" ON google_tokens;
DROP POLICY IF EXISTS "Users can read their own google tokens" ON google_tokens;
DROP POLICY IF EXISTS "Users can update their own google tokens" ON google_tokens;
DROP POLICY IF EXISTS "Users can delete their own google tokens" ON google_tokens;

-- Create new policies
CREATE POLICY "Users can insert their own google tokens" ON google_tokens
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can read their own google tokens" ON google_tokens
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own google tokens" ON google_tokens
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own google tokens" ON google_tokens
    FOR DELETE USING (auth.uid()::text = user_id);

-- Verify the policies were created
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
