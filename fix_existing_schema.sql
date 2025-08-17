-- Fix existing database schema
-- This script safely updates the existing schema without breaking anything

-- Add missing columns to resources table if they don't exist
DO $$ 
BEGIN 
  -- Check if subcategory_id column exists, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resources' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE resources ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_resources_subcategory_id ON resources(subcategory_id);
  END IF;

  -- Check if user_id column exists in categories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
  END IF;

  -- Check if user_id column exists in subcategories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'subcategories' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE subcategories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_subcategories_user_id ON subcategories(user_id);
  END IF;

  -- Check if color column exists in categories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE categories ADD COLUMN color TEXT DEFAULT '#3B82F6';
  END IF;

  -- Check if icon column exists in categories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'icon'
  ) THEN
    ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'folder';
  END IF;

  -- Check if sort_order column exists in categories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;

  -- Check if is_default column exists in categories, add it if missing
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'categories' 
    AND column_name = 'is_default'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- Create RLS policies for categories
CREATE POLICY "Users can view their own categories" ON categories 
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own categories" ON categories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories 
  FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies if they exist and recreate them for subcategories
DROP POLICY IF EXISTS "Users can view their own subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can insert their own subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can update their own subcategories" ON subcategories;
DROP POLICY IF EXISTS "Users can delete their own subcategories" ON subcategories;

-- Create RLS policies for subcategories
CREATE POLICY "Users can view their own subcategories" ON subcategories 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subcategories" ON subcategories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcategories" ON subcategories 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcategories" ON subcategories 
  FOR DELETE USING (auth.uid() = user_id);

-- Update existing categories to have a user_id if they don't
-- WARNING: This will assign all categories without user_id to the current user
-- Comment out this section if you have multiple users and want to handle manually
/*
UPDATE categories 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND auth.uid() IS NOT NULL;
*/

-- Function to create default categories for a user
CREATE OR REPLACE FUNCTION create_default_categories_for_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (name, description, color, icon, user_id, is_default, sort_order)
  VALUES 
    ('General', 'General resources and documents', '#6B7280', 'folder', target_user_id, true, 1),
    ('Projects', 'Project-related resources', '#3B82F6', 'briefcase', target_user_id, true, 2),
    ('Learning', 'Educational materials and courses', '#10B981', 'book-open', target_user_id, true, 3),
    ('Reference', 'Reference materials and documentation', '#F59E0B', 'bookmark', target_user_id, true, 4)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
