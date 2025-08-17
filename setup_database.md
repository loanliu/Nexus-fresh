# Database Setup Guide

## 1. Run the Complete Schema Setup

In your Supabase SQL Editor, run the `setup_complete_schema.sql` file to create all necessary tables and policies.

## 2. Check if Tables Exist

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'subcategories', 'resources', 'tags', 'api_keys');
```

## 3. Create Default Categories for Current User

```sql
-- Replace 'your-user-id' with your actual user ID from auth.users
SELECT create_default_categories_for_user('your-user-id'::uuid);

-- Or if you want to create for the current authenticated user:
SELECT create_default_categories_for_user(auth.uid());
```

## 4. Check Categories

```sql
-- View all categories for current user
SELECT * FROM categories WHERE user_id = auth.uid();
```

## 5. Manual Category Creation (Alternative)

If the function doesn't work, manually create categories:

```sql
INSERT INTO categories (name, description, color, icon, user_id, is_default, sort_order)
VALUES 
  ('General', 'General resources and documents', '#6B7280', 'folder', auth.uid(), true, 1),
  ('Projects', 'Project-related resources', '#3B82F6', 'briefcase', auth.uid(), true, 2),
  ('Learning', 'Educational materials and courses', '#10B981', 'book-open', auth.uid(), true, 3),
  ('Reference', 'Reference materials and documentation', '#F59E0B', 'bookmark', auth.uid(), true, 4);
```

## 6. Test the Application

After running the schema setup:
1. Refresh your application
2. Go to the Categories tab to see if categories appear
3. Try creating a new category
4. Try uploading a resource - categories should now appear in the dropdown

## Common Issues

### "Failed to fetch categories" Error
- Check if the `categories` table exists
- Verify RLS policies are correctly set
- Make sure you're authenticated (check auth.uid())

### Empty Categories Dropdown
- Run the default categories creation script
- Or manually create some categories using the SQL above

### Permission Errors
- Verify RLS policies are enabled and correct
- Check that your user is properly authenticated
- Ensure the user_id matches between tables
