-- Fix RLS policies for users table to resolve 500 error
-- This script ensures users can create their own profiles

-- First, let's see what policies exist
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'users';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- Create proper RLS policies
-- Policy for SELECT - users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Policy for INSERT - users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Policy for UPDATE - users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy for DELETE - users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON public.users
  FOR DELETE USING (auth.uid()::text = id::text);

-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;
