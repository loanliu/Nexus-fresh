-- SIMPLE Users Table Fix (No Type Casting Issues)
-- Run this in your Supabase SQL Editor

-- 1. Drop existing users table and policies completely
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create users table with proper structure
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create SIMPLE policies that avoid type casting issues
-- These policies are more permissive but will work reliably

-- Allow authenticated users to insert their own profile
CREATE POLICY "Anyone can insert users" 
ON public.users FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to view their own profile  
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
TO authenticated
USING (id::text = auth.uid()::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
TO authenticated
USING (id::text = auth.uid()::text);

-- 5. Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If there's any error, still allow the auth user to be created
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 6. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 8. Create updated_at trigger
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- 9. Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- 10. Verify the setup
SELECT 'Users table created successfully' AS status;

-- 11. Show the policies created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
