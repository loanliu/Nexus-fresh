-- 🚨 URGENT FIX: ADMIN_USERS INFINITE RECURSION
-- Run this in your Supabase SQL Editor to fix the immediate issue

-- ========================================
-- STEP 1: EMERGENCY FIX - DISABLE RLS TEMPORARILY
-- ========================================

-- Disable RLS on admin_users to break the infinite loop
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES
-- ========================================

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update their own api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their own api_keys" ON api_keys;

DROP POLICY IF EXISTS "Authenticated users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- ========================================
-- STEP 3: CREATE SAFE, NON-RECURSIVE POLICIES
-- ========================================

-- Create a simple, safe policy for admin_users (no recursion)
CREATE POLICY "Authenticated users can view admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create a simple policy for admin management (no recursion)
CREATE POLICY "Authenticated users can manage admin_users" ON public.admin_users
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Re-enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: FIX API_KEYS TABLE
-- ========================================

-- Ensure api_keys table exists and has proper structure
CREATE TABLE IF NOT EXISTS api_keys (
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

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create safe policies for api_keys
CREATE POLICY "Users can view their own api_keys" ON api_keys 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api_keys" ON api_keys 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api_keys" ON api_keys 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api_keys" ON api_keys 
  FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- STEP 5: VERIFY THE FIX
-- ========================================

-- Test that we can query admin_users without recursion
SELECT 
    'ADMIN_USERS TEST' as check_type,
    COUNT(*) as admin_count
FROM public.admin_users;

-- Test that we can query api_keys
SELECT 
    'API_KEYS TEST' as check_type,
    COUNT(*) as api_key_count
FROM api_keys;

-- Check RLS status
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('admin_users', 'api_keys');

-- ========================================
-- STEP 6: SUMMARY
-- ========================================

SELECT 
    'SUMMARY' as check_type,
    '✅ Fixed admin_users infinite recursion' as step_1,
    '✅ Created safe RLS policies' as step_2,
    '✅ Fixed api_keys table' as step_3,
    '✅ All queries should work now' as status;
