-- Fix infinite recursion in admin_users RLS policy
-- This script removes the problematic recursive policy and creates a safer one

-- First, let's see what policies exist on admin_users
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';

-- Drop all existing policies on admin_users to start fresh
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- Create a safer policy that doesn't cause infinite recursion
-- Option 1: Allow only authenticated users to view admin_users (less secure but no recursion)
CREATE POLICY "Authenticated users can view admin_users" ON public.admin_users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Option 2: Use a function-based approach to avoid recursion (more secure)
-- First create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if the user exists in admin_users table
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create policies using the function
CREATE POLICY "Admin users can manage admin_users" ON public.admin_users
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

-- Alternative: If you want to be more restrictive, you can use this approach:
-- CREATE POLICY "Only super admins can manage admin_users" ON public.admin_users
--   FOR ALL USING (
--     auth.uid() IN (
--       SELECT user_id FROM public.admin_users 
--       WHERE is_super_admin = true  -- Assuming you have this column
--     )
--   );

-- Test the fix
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'admin_users';
