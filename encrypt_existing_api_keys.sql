-- Encrypt Existing API Keys
-- This script encrypts API keys that are currently stored as plain text
-- Run this AFTER implementing the encryption system

-- First, let's see what we're working with
SELECT 
    id,
    service_name,
    key_name,
    LEFT(encrypted_key, 50) as key_preview,
    LENGTH(encrypted_key) as key_length,
    created_at
FROM api_keys 
ORDER BY created_at DESC;

-- Check if keys are already encrypted (they should be base64 encoded and longer)
-- Plain text API keys are typically shorter than encrypted ones
SELECT 
    COUNT(*) as total_keys,
    COUNT(CASE WHEN LENGTH(encrypted_key) < 50 THEN 1 END) as likely_plaintext,
    COUNT(CASE WHEN LENGTH(encrypted_key) >= 50 THEN 1 END) as likely_encrypted
FROM api_keys;

-- WARNING: This is a destructive operation that will encrypt existing keys
-- Make sure you have a backup before running this!

-- If you need to encrypt existing keys, you'll need to:
-- 1. Export the current keys
-- 2. Encrypt them using your encryption utility
-- 3. Update the database

-- Example of how to update a single key (replace with actual encrypted value):
-- UPDATE api_keys 
-- SET encrypted_key = 'your_encrypted_key_here'
-- WHERE id = 'specific_key_id';

-- For now, this script just shows you the current state
-- You'll need to implement the actual encryption in your application
