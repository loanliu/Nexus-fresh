-- Setup API Keys Table
-- Run this script in your Supabase SQL Editor to create the API keys table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_name TEXT NOT NULL,
  key_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  setup_instructions TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  last_tested TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'invalid', 'testing')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  usage_limits JSONB DEFAULT '{}'
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own api_keys" ON api_keys 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api_keys" ON api_keys 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api_keys" ON api_keys 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api_keys" ON api_keys 
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for api_keys
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON api_keys TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
