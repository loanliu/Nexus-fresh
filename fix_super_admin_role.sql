-- Fix super_admin role in project_members table
-- The current schema only allows 'owner', 'admin', 'editor', 'viewer'
-- but we need to add 'super_admin' to the allowed roles

-- First, let's check what roles currently exist
SELECT DISTINCT role FROM project_members;

-- Update the constraint to allow super_admin
ALTER TABLE public.project_members 
DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_role_check 
CHECK (role IN ('owner', 'admin', 'super_admin', 'editor', 'viewer'));

-- Also update the project_invites table to allow super_admin
ALTER TABLE public.project_invites 
DROP CONSTRAINT IF EXISTS project_invites_role_check;

ALTER TABLE public.project_invites 
ADD CONSTRAINT project_invites_role_check 
CHECK (role IN ('admin', 'super_admin', 'editor', 'viewer'));

-- Check if the user exists in project_members
SELECT * FROM project_members WHERE user_id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2';

-- If not, let's add them as super_admin for the project
-- First, let's see what projects exist
SELECT id, name FROM projects LIMIT 5;
