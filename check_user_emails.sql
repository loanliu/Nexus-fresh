-- Check user emails for the two user IDs we see in the logs
SELECT 
  id,
  email,
  raw_user_meta_data->>'email' as meta_email,
  created_at
FROM auth.users 
WHERE id IN ('a8ad4586-7170-4116-a224-cdd112e4d3d2', '1895c44b-205a-4537-aaa2-472953e4cc2a')
ORDER BY created_at;
