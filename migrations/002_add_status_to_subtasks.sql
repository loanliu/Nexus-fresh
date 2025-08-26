-- Migration: Add status column to subtasks table
-- This migration adds a status field for subtask completion tracking

-- Add status column to subtasks table
ALTER TABLE subtasks 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add comment for documentation
COMMENT ON COLUMN subtasks.status IS 'Status of the subtask: pending, in_progress, completed, cancelled';

-- Update existing subtasks to have a default status
UPDATE subtasks 
SET status = 'pending' 
WHERE status IS NULL;

-- Make status column NOT NULL after setting defaults
ALTER TABLE subtasks 
ALTER COLUMN status SET NOT NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE subtasks 
ADD CONSTRAINT check_subtask_status 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
