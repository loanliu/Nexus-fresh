-- Add project_id column to resources table
ALTER TABLE resources 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_resources_project_id ON resources(project_id);

-- Add index for user_id and project_id combination
CREATE INDEX idx_resources_user_project ON resources(user_id, project_id);

-- Update RLS policies to allow users to see resources from their projects
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;

-- Create new policies that consider project membership
CREATE POLICY "Users can view resources from their projects" ON resources
  FOR SELECT USING (
    user_id = auth.uid() OR 
    (project_id IS NOT NULL AND project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert resources" ON resources
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND (
      project_id IS NULL OR 
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own resources" ON resources
  FOR UPDATE USING (
    user_id = auth.uid() AND (
      project_id IS NULL OR 
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own resources" ON resources
  FOR DELETE USING (
    user_id = auth.uid() AND (
      project_id IS NULL OR 
      project_id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );
