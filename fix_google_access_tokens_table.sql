-- 🔧 FIX GOOGLE_ACCESS_TOKENS TABLE STRUCTURE
-- Run this in your Supabase SQL Editor to add user_id column

-- ========================================
-- STEP 1: CHECK CURRENT TABLE STRUCTURE
-- ========================================

-- First, let's see what we're working with
SELECT 
    'CURRENT TABLE STRUCTURE' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'google_access_tokens'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: ADD USER_ID COLUMN IF IT DOESN'T EXIST
-- ========================================

-- Check if user_id column exists and add it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'google_access_tokens' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE public.google_access_tokens 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added user_id column to google_access_tokens table';
    ELSE
        RAISE NOTICE '✅ user_id column already exists in google_access_tokens table';
    END IF;
END $$;

-- ========================================
-- STEP 3: VERIFY COLUMN WAS CREATED
-- ========================================

-- Double-check that the column now exists
SELECT 
    'VERIFICATION: USER_ID COLUMN EXISTS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'google_access_tokens' 
            AND column_name = 'user_id'
        ) THEN '✅ USER_ID COLUMN EXISTS'
        ELSE '❌ USER_ID COLUMN STILL MISSING'
    END as column_status;

-- ========================================
-- STEP 4: UPDATE EXISTING ROWS WITH USER_ID
-- ========================================

-- Now that we know the column exists, update existing rows
-- This is the critical step - we MUST do this before making user_id NOT NULL
UPDATE public.google_access_tokens 
SET user_id = auth.users.id
FROM auth.users 
WHERE google_access_tokens.user_email = auth.users.email
AND google_access_tokens.user_id IS NULL;

-- Check how many rows were updated
SELECT 
    'UPDATE RESULTS' as info_type,
    COUNT(*) as total_rows,
    COUNT(user_id) as rows_with_user_id,
    COUNT(user_email) as rows_with_user_email,
    CASE 
        WHEN COUNT(*) = COUNT(user_id) THEN '✅ ALL ROWS NOW HAVE USER_ID'
        ELSE '❌ SOME ROWS STILL MISSING USER_ID'
    END as status
FROM public.google_access_tokens;

-- ========================================
-- STEP 5: VERIFY ALL ROWS HAVE USER_ID BEFORE MAKING NOT NULL
-- ========================================

-- Double-check that all rows now have user_id
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.google_access_tokens 
    WHERE user_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION '❌ Cannot proceed: % rows still have NULL user_id. Please check the data first.', null_count;
    ELSE
        RAISE NOTICE '✅ All rows have user_id - safe to make column NOT NULL';
    END IF;
END $$;

-- ========================================
-- STEP 6: MAKE USER_ID NOT NULL AFTER POPULATING
-- ========================================

-- Only make user_id NOT NULL if all rows have values
ALTER TABLE public.google_access_tokens 
ALTER COLUMN user_id SET NOT NULL;

RAISE NOTICE '✅ user_id column is now NOT NULL';

-- ========================================
-- STEP 7: CREATE INDEXES FOR BETTER PERFORMANCE
-- ========================================

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_access_tokens_user_id 
ON public.google_access_tokens(user_id);

-- Create index on user_email for backward compatibility
CREATE INDEX IF NOT EXISTS idx_google_access_tokens_user_email 
ON public.google_access_tokens(user_email);

-- ========================================
-- STEP 8: FINAL VERIFICATION
-- ========================================

-- Check final table structure
SELECT 
    'FINAL TABLE STRUCTURE' as info_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'google_access_tokens'
ORDER BY ordinal_position;

-- Final check that everything is working
SELECT 
    'FINAL STATUS CHECK' as check_type,
    COUNT(*) as total_rows,
    COUNT(user_id) as rows_with_user_id,
    COUNT(user_email) as rows_with_user_email,
    CASE 
        WHEN COUNT(*) = COUNT(user_id) THEN '✅ SUCCESS: ALL ROWS HAVE USER_ID'
        ELSE '❌ FAILURE: SOME ROWS MISSING USER_ID'
    END as final_status
FROM public.google_access_tokens;

-- ========================================
-- STEP 9: COMPLETION
-- ========================================

SELECT 
    'FIX COMPLETE' as status,
    NOW() as completed_at;
