-- Immediate fix for admin_users infinite recursion
-- This removes the problematic policy that's causing the infinite recursion

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admin users can view admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can insert admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can delete admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update admin_users" ON public.admin_users;

-- Create a simple, non-recursive policy
-- For now, allow authenticated users to view admin_users to prevent the error
CREATE POLICY "Authenticated users can view admin_users" ON public.admin_users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- This is a temporary fix - you can make it more secure later
-- The key is to avoid policies that reference the same table they're protecting
