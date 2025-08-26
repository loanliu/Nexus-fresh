-- Migration: Create subtasks table with RLS policies
-- This migration creates a one-level subtask system for tasks

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title text NOT NULL,
    done boolean NOT NULL DEFAULT false,
    order_index int NOT NULL DEFAULT 0,
    estimate_hours numeric(5,2) NULL,
    created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order_index ON subtasks(order_index);

-- Enable Row Level Security
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select subtasks for tasks they own
CREATE POLICY "Users can view subtasks for their own tasks" ON subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Policy: Users can only insert subtasks for tasks they own
CREATE POLICY "Users can create subtasks for their own tasks" ON subtasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Policy: Users can only update subtasks for tasks they own
CREATE POLICY "Users can update subtasks for their own tasks" ON subtasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Policy: Users can only delete subtasks for tasks they own
CREATE POLICY "Users can delete subtasks for their own tasks" ON subtasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = subtasks.task_id 
            AND tasks.user_id = auth.uid()
        )
    );

-- Add comment for documentation
COMMENT ON TABLE subtasks IS 'One-level subtasks for tasks. Users can only access subtasks for tasks they own.';
COMMENT ON COLUMN subtasks.task_id IS 'Reference to parent task';
COMMENT ON COLUMN subtasks.order_index IS 'Order for display and sorting';
COMMENT ON COLUMN subtasks.estimate_hours IS 'Estimated hours for this subtask (max 999.99)';
