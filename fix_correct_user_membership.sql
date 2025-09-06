-- Fix project membership for the correct user ID
-- The current user ID in the logs is wrong, the correct one is: 1895c44b-205a-4537-aaa2-472953e4cc2a

-- First, let's see what's currently in the project_members table
SELECT 'Current project members:' as info;
SELECT project_id, user_id, role, joined_at
FROM project_members
ORDER BY joined_at;

-- Remove the incorrect user ID membership
DELETE FROM project_members
WHERE user_id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2';

-- Add the correct user ID as admin for the project
INSERT INTO project_members (project_id, user_id, role, joined_at)
VALUES (
    '7d744fa7-d228-466e-87b0-27d19ac7c844',  -- Project ID
    '1895c44b-205a-4537-aaa2-472953e4cc2a',  -- Correct user ID
    'admin',                                  -- Role
    NOW()                                     -- Joined date
);

-- Verify the fix
SELECT 'Fixed project members:' as info;
SELECT project_id, user_id, role, joined_at
FROM project_members
WHERE project_id = '7d744fa7-d228-466e-87b0-27d19ac7c844'
ORDER BY joined_at;
