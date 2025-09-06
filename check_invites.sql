-- Check recent invites to see what emails were stored
SELECT 
  id,
  project_id,
  email,
  role,
  status,
  token,
  created_at,
  expires_at
FROM project_invites 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
