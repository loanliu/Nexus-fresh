-- 🔑 ADD CURRENT USER AS ADMIN - FIXED VERSION
-- Run this in your Supabase SQL Editor

-- ========================================
-- STEP 1: FIND YOUR USER ID
-- ========================================

-- First, let's see all users in the auth system
SELECT 
    'AUTH USERS' as info_type,
    id as user_id,
    email,
    created_at,
    CASE 
        WHEN email = 'your-email@example.com' THEN '👤 THIS IS YOU'
        ELSE '👥 OTHER USER'
    END as identification
FROM auth.users 
ORDER BY created_at;

-- ========================================
-- STEP 2: CHECK CURRENT ADMIN_USERS TABLE
-- ========================================

-- See what's currently in admin_users
SELECT 
    'CURRENT ADMIN USERS' as info_type,
    user_id,
    created_at,
    updated_at
FROM public.admin_users
ORDER BY created_at;

-- ========================================
-- STEP 3: MANUALLY ADD YOURSELF AS ADMIN
-- ========================================

-- Replace 'your-actual-user-id-here' with the ID from step 1
-- Look for the row that says "THIS IS YOU" and copy that ID

-- Temporarily disable RLS
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;

-- Insert yourself as admin (REPLACE THE UUID BELOW!)
INSERT INTO public.admin_users (user_id, created_at, updated_at)
VALUES (
    'e6a10071-6daf-4ea8-ac2d-2e9a48e9f201', -- Replace with your actual user ID from step 1
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO NOTHING; -- This prevents duplicate insert errors

-- Re-enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 4: VERIFY THE FIX
-- ========================================

-- Check if you're now an admin
SELECT 
    'ADMIN VERIFICATION' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = 'e6a10071-6daf-4ea8-ac2d-2e9a48e9f201' -- Use your actual user ID
        ) THEN '✅ USER IS NOW ADMIN'
        ELSE '❌ FAILED TO ADD USER AS ADMIN'
    END as admin_status;

-- Show final admin users list
SELECT 
    'FINAL ADMIN USERS' as list_type,
    user_id,
    created_at,
    updated_at
FROM public.admin_users
ORDER BY created_at;