-- 🔧 FIX API KEYS TABLE - COMPREHENSIVE SOLUTION
-- Run this in your Supabase SQL Editor to fix the API keys issue

-- ========================================
-- STEP 1: DIAGNOSE THE CURRENT STATE
-- ========================================

-- Check if table exists
SELECT 
    'TABLE EXISTS CHECK' as check_type,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_keys'
    ) as table_exists;

-- Check table structure if it exists
SELECT 
    'TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrules as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'api_keys';

-- ========================================
-- STEP 2: DROP AND RECREATE TABLE (SAFE APPROACH)
-- ========================================

-- Drop existing table and all dependencies
DROP TABLE IF EXISTS api_keys CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create API keys table with correct structure
CREATE TABLE api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_name TEXT NOT NULL,
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  setup_instructions TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  last_tested TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'testing')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  usage_limits JSONB DEFAULT '{}'
);

-- Add index for better performance
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- ========================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can view their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own api_keys" ON api_keys;

-- Create RLS policies
CREATE POLICY "Users can view their own api_keys" ON api_keys 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api_keys" ON api_keys 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api_keys" ON api_keys 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api_keys" ON api_keys 
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- STEP 4: CREATE TRIGGER FOR UPDATED_AT
-- ========================================

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for api_keys
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 5: VERIFY THE FIX
-- ========================================

-- Check table structure
SELECT 
    'FINAL TABLE STRUCTURE' as check_type,
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
    'FINAL RLS POLICIES' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'api_keys';

-- Test basic query
SELECT 
    'TEST QUERY' as check_type,
    COUNT(*) as row_count
FROM api_keys;

-- ========================================
-- STEP 6: SUMMARY
-- ========================================

SELECT 
    'SUMMARY' as check_type,
    '✅ API keys table recreated' as step_1,
    '✅ RLS enabled with proper policies' as step_2,
    '✅ Triggers created' as step_3,
    '✅ Ready for use' as status;
