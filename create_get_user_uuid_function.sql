-- Create a function to get user UUID by email from auth.users table
CREATE OR REPLACE FUNCTION get_user_uuid_by_email(user_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Query the auth.users table to get the UUID
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = user_email;
    
    RETURN user_uuid;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_uuid_by_email(TEXT) TO authenticated;

-- Test the function
SELECT get_user_uuid_by_email('loanliu@gmail.com');
