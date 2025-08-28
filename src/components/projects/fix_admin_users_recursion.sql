-- 🔒 FIX INFINITE RECURSION IN ADMIN_USERS RLS POLICY
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: TEMPORARILY DISABLE RLS TO STOP THE LOOP
-- ========================================

-- Disable RLS temporarily to break the infinite loop
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 2: DROP THE PROBLEMATIC POLICIES
-- ========================================

-- Remove all existing policies that cause recursion
DROP POLICY IF EXISTS "Admin users can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- ========================================
-- STEP 3: CREATE A SAFE, NON-RECURSIVE POLICY
-- ========================================

-- Option 1: Simple policy - allow authenticated users to view admin_users
-- This is less secure but prevents recursion
CREATE POLICY "Authenticated users can view admin_users" ON public.admin_users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Option 2: Use a function-based approach to avoid recursion
-- Create a function that checks admin status without recursion
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    -- Check if the user exists in admin_users table
    -- This function runs with SECURITY DEFINER to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policies using the function
CREATE POLICY "Admin users can manage admin_users" ON public.admin_users
    FOR ALL USING (
        auth.uid() IS NOT NULL AND is_user_admin(auth.uid())
    );

-- ========================================
-- STEP 4: RE-ENABLE RLS WITH SAFE POLICIES
-- ========================================

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 5: VERIFY THE FIX
-- ========================================

-- Check that policies exist and are safe
SELECT 
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual LIKE '%admin_users%' AND qual LIKE '%auth.uid()%' THEN '⚠️ POTENTIALLY RECURSIVE'
        ELSE '✅ SAFE'
    END as policy_safety
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'admin_users';

-- Test if the infinite recursion is fixed
SELECT 
    'RECURSION TEST' as test_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid()
        ) THEN '✅ NO RECURSION - USER CAN ACCESS ADMIN TABLE'
        ELSE '⚠️ USER CANNOT ACCESS ADMIN TABLE (may need to be added as admin)'
    END as test_result;