-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_user_id ON subcategories(user_id);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subcategories
CREATE POLICY "Users can view their own subcategories" ON subcategories 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subcategories" ON subcategories 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subcategories" ON subcategories 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subcategories" ON subcategories 
  FOR DELETE USING (auth.uid() = user_id);

-- Add subcategory_id column to resources table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'resources' 
    AND column_name = 'subcategory_id'
  ) THEN
    ALTER TABLE resources ADD COLUMN subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_resources_subcategory_id ON resources(subcategory_id);
  END IF;
END $$;

-- Update the updated_at timestamp trigger for subcategories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subcategories_updated_at ON subcategories;
CREATE TRIGGER update_subcategories_updated_at 
  BEFORE UPDATE ON subcategories 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
