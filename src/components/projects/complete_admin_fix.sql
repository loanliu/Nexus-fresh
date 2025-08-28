-- �� COMPLETE ADMIN FIX - INCLUDES ALL REQUIRED COLUMNS
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: CHECK TABLE STRUCTURE
-- ========================================

-- See the actual structure of admin_users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'admin_users'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: GET YOUR USER EMAIL
-- ========================================

-- Find your user details from auth.users
SELECT 
    'YOUR USER INFO' as info_type,
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE id = 'e6a10071-6daf-4ea8-ac2d-2e9a48e9f201';

-- ========================================
-- STEP 3: ADD YOURSELF AS ADMIN WITH ALL COLUMNS
-- ========================================

-- Disable RLS temporarily
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Insert with all required columns
INSERT INTO public.admin_users (user_id, email, role, created_at, updated_at)
VALUES (
    'e6a10071-6daf-4ea8-ac2d-2e9a48e9f201', -- Your user ID
    'your-email@example.com', -- Replace with your actual email from step 2
    'admin', -- Role
    NOW(), -- Created at
    NOW()  -- Updated at
)
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: VERIFY THE FIX
-- ========================================

-- Check if you're now an admin
SELECT 
    'ADMIN VERIFICATION' as check_type,
    user_id,
    email,
    role,
    created_at,
    updated_at
FROM public.admin_users
WHERE user_id = 'e6a10071-6daf-4ea8-ac2d-2e9a48e9f201';