-- Fix Category RLS Infinite Recursion
-- The issue is that our RLS policy is trying to query the categories table
-- from within a policy that's protecting the categories table itself

-- 1. Drop the problematic RLS policies
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

-- 2. Create simpler, non-recursive RLS policies
-- SELECT policy: Users can view their own categories OR categories used by resources in projects they're members of
-- We'll use a different approach to avoid recursion
CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR EXISTS (
            SELECT 1 
            FROM resources r
            JOIN project_members pm ON pm.project_id = r.project_id
            WHERE r.category_id = categories.id
            AND pm.user_id = auth.uid()
        )
    );

-- INSERT policy: Users can create their own categories
CREATE POLICY "categories_insert_policy" ON categories
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- UPDATE policy: Users can update their own categories
CREATE POLICY "categories_update_policy" ON categories
    FOR UPDATE
    USING (user_id = auth.uid());

-- DELETE policy: Users can delete their own categories
CREATE POLICY "categories_delete_policy" ON categories
    FOR DELETE
    USING (user_id = auth.uid());

-- 3. Test the new policies
-- This should work without recursion
SELECT 
    c.id,
    c.name,
    c.description,
    c.color,
    CASE 
        WHEN c.user_id = auth.uid() THEN 'owner'
        WHEN EXISTS (
            SELECT 1 
            FROM resources r
            JOIN project_members pm ON pm.project_id = r.project_id
            WHERE r.category_id = c.id
            AND pm.user_id = auth.uid()
        ) THEN 'shared_via_resources'
        ELSE 'unknown'
    END as access_type
FROM categories c
WHERE (
    c.user_id = auth.uid() 
    OR EXISTS (
        SELECT 1 
        FROM resources r
        JOIN project_members pm ON pm.project_id = r.project_id
        WHERE r.category_id = c.id
        AND pm.user_id = auth.uid()
    )
)
ORDER BY c.name;
