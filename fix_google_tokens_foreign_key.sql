-- Fix Google Tokens Foreign Key Constraint Issue
-- This script provides options to resolve the foreign key constraint problem

-- Option 1: Temporarily disable the foreign key constraint
-- This allows us to store tokens without requiring a user profile
ALTER TABLE google_tokens DROP CONSTRAINT IF EXISTS google_tokens_user_id_fkey;

-- Option 2: Create a more flexible foreign key that allows NULL values
-- ALTER TABLE google_tokens ALTER COLUMN user_id DROP NOT NULL;

-- Option 3: Create a trigger to automatically create user profiles when needed
-- This is the most robust solution

-- Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'google_tokens' 
AND table_schema = 'public';

-- Check current constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'google_tokens' 
AND table_schema = 'public';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'google_tokens';

-- If you want to re-enable the foreign key later, use this:
-- ALTER TABLE google_tokens ADD CONSTRAINT google_tokens_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
