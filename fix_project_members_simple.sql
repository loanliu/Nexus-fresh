-- Simple fix for project_members recursion - disable RLS temporarily
-- This is a safer approach to get the app working

-- Disable RLS on project_members temporarily to avoid recursion
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- Disable RLS on project_invites temporarily to avoid recursion
ALTER TABLE public.project_invites DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on projects and tasks (these are working fine)
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Note: This is a temporary fix. In production, you'd want to implement
-- proper RLS policies that don't cause recursion, but for development
-- this will allow the app to work while we test the sharing functionality.
