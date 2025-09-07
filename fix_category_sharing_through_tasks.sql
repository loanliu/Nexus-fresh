-- Fix Category Sharing Through Tasks
-- Categories are shared through the relationship: Project → Tasks → Categories
-- This approach doesn't modify the categories table structure

-- 1. Drop the incorrect project_id column if it was added
ALTER TABLE categories DROP COLUMN IF EXISTS project_id;

-- 2. Drop the incorrect index if it was created
DROP INDEX IF EXISTS idx_categories_project_id;

-- 3. Drop existing RLS policies on categories
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

-- 4. Create new RLS policies for categories that work through tasks
-- SELECT policy: Users can view their own categories OR categories used by tasks in projects they're members of
CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR id IN (
            SELECT DISTINCT c.id
            FROM categories c
            JOIN tasks t ON t.category = c.name
            JOIN project_members pm ON pm.project_id = t.project_id
            WHERE pm.user_id = auth.uid()
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

-- 5. Test the new policies by checking what categories a user can see
-- This query simulates what a project member should see
SELECT 
    c.id,
    c.name,
    c.description,
    c.color,
    CASE 
        WHEN c.user_id = auth.uid() THEN 'owner'
        WHEN c.id IN (
            SELECT DISTINCT c2.id
            FROM categories c2
            JOIN tasks t ON t.category = c2.name
            JOIN project_members pm ON pm.project_id = t.project_id
            WHERE pm.user_id = auth.uid()
        ) THEN 'shared_via_tasks'
        ELSE 'unknown'
    END as access_type,
    -- Show which projects use this category
    (
        SELECT array_agg(DISTINCT p.name)
        FROM projects p
        JOIN tasks t ON t.project_id = p.id
        JOIN project_members pm ON pm.project_id = p.id
        WHERE t.category = c.name 
        AND pm.user_id = auth.uid()
    ) as shared_in_projects
FROM categories c
WHERE (
    c.user_id = auth.uid() 
    OR c.id IN (
        SELECT DISTINCT c2.id
        FROM categories c2
        JOIN tasks t ON t.category = c2.name
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE pm.user_id = auth.uid()
    )
)
ORDER BY c.name;
