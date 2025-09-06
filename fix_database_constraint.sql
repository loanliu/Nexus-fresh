-- Fix the project_members table to allow super_admin role
-- The current constraint only allows: 'owner', 'admin', 'editor', 'viewer'
-- We need to add 'super_admin' to the allowed roles

-- First, let's see what the current constraint looks like
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.project_members'::regclass 
AND conname LIKE '%role%';

-- Drop the existing constraint
ALTER TABLE public.project_members 
DROP CONSTRAINT IF EXISTS project_members_role_check;

-- Add the new constraint that includes super_admin
ALTER TABLE public.project_members 
ADD CONSTRAINT project_members_role_check 
CHECK (role IN ('owner', 'admin', 'super_admin', 'editor', 'viewer'));

-- Also update the project_invites table to allow super_admin
ALTER TABLE public.project_invites 
DROP CONSTRAINT IF EXISTS project_invites_role_check;

ALTER TABLE public.project_invites 
ADD CONSTRAINT project_invites_role_check 
CHECK (role IN ('admin', 'super_admin', 'editor', 'viewer'));

-- Verify the constraints are updated
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.project_members'::regclass 
AND conname LIKE '%role%';
