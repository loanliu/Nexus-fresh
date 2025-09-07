-- Add Project Association to Categories Table
-- This migration adds project_id column to categories and updates RLS policies for sharing

-- 1. Add project_id column to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- 2. Create index on project_id for better performance
CREATE INDEX IF NOT EXISTS idx_categories_project_id ON categories(project_id);

-- 3. Drop existing RLS policies on categories
DROP POLICY IF EXISTS "Users can view their own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON categories;

-- 4. Create new RLS policies for categories with project sharing support
-- SELECT policy: Users can view their own categories OR categories from projects they're members of
CREATE POLICY "categories_select_policy" ON categories
    FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid()
            )
        )
    );

-- INSERT policy: Users can create categories and assign them to projects they have admin access to
CREATE POLICY "categories_insert_policy" ON categories
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND (
            project_id IS NULL 
            OR project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin')
            )
        )
    );

-- UPDATE policy: Users can edit their own categories OR categories from projects they have admin access to
CREATE POLICY "categories_update_policy" ON categories
    FOR UPDATE
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin')
            )
        )
    );

-- DELETE policy: Users can delete their own categories OR categories from projects they have admin access to
CREATE POLICY "categories_delete_policy" ON categories
    FOR DELETE
    USING (
        user_id = auth.uid() 
        OR (
            project_id IS NOT NULL 
            AND project_id IN (
                SELECT project_id 
                FROM project_members 
                WHERE user_id = auth.uid() 
                AND role IN ('owner', 'admin', 'super_admin')
            )
        )
    );

-- 5. Test the new policies by checking what categories a user can see
-- This query simulates what a project member should see
SELECT 
    c.id,
    c.name,
    c.description,
    c.color,
    c.project_id,
    p.name as project_name,
    p.color as project_color,
    CASE 
        WHEN c.user_id = auth.uid() THEN 'owner'
        WHEN c.project_id IS NOT NULL THEN 'shared'
        ELSE 'unknown'
    END as access_type
FROM categories c
LEFT JOIN projects p ON c.project_id = p.id
WHERE (
    c.user_id = auth.uid() 
    OR (
        c.project_id IS NOT NULL 
        AND c.project_id IN (
            SELECT project_id 
            FROM project_members 
            WHERE user_id = auth.uid()
        )
    )
)
ORDER BY c.name;
