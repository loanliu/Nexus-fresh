-- Fix users table structure by adding missing columns
-- This approach preserves existing data and foreign key relationships

-- Add missing columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the existing Google OAuth user record
UPDATE public.users 
SET 
    full_name = 'Loan Liu',
    avatar_url = 'https://lh3.googleusercontent.com/a/ACg8ocJ4EcJK-H5ZgkJJXm5CorSEn8I4_1nrqDLQyQNy-IomB7ReEJqS=s96-c',
    updated_at = NOW()
WHERE id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create trigger function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, preferences)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    '{}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    ) THEN
        -- Create RLS policies
        CREATE POLICY "Users can view their own profile" ON public.users
          FOR SELECT USING (auth.uid()::text = id::text);

        CREATE POLICY "Users can insert their own profile" ON public.users
          FOR INSERT WITH CHECK (auth.uid()::text = id::text);

        CREATE POLICY "Users can update their own profile" ON public.users
          FOR UPDATE USING (auth.uid()::text = id::text);
    END IF;
END $$;

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- Show the updated user record
SELECT * FROM public.users WHERE id = 'a8ad4586-7170-4116-a224-cdd112e4d3d2';
