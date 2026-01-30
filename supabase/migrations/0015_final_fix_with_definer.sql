-- DEFINITIVE FIX using SECURITY DEFINER function
-- This bypasses all recursion issues by running the check with elevated privileges

-- 1. Disable RLS momentarily
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- 2. Create a secure helper function to get accessible project IDs
-- This runs as database owner, so it can see project_members table regardless of RLS
CREATE OR REPLACE FUNCTION get_accessible_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    -- My created projects
    SELECT id FROM projects WHERE created_by = auth.uid()
    UNION
    -- Projects where I am a member
    SELECT project_id FROM project_members WHERE user_id = auth.uid();
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_accessible_project_ids TO authenticated;


-- 3. Clear ALL existing policies again (to be safe)
DROP POLICY IF EXISTS "view_projects" ON projects;
DROP POLICY IF EXISTS "insert_projects" ON projects;
DROP POLICY IF EXISTS "update_projects" ON projects;
DROP POLICY IF EXISTS "delete_projects" ON projects;

DROP POLICY IF EXISTS "view_members" ON project_members;
DROP POLICY IF EXISTS "insert_members" ON project_members;
DROP POLICY IF EXISTS "update_members" ON project_members;
DROP POLICY IF EXISTS "delete_members" ON project_members;

DROP POLICY IF EXISTS "view_tasks" ON tasks;
DROP POLICY IF EXISTS "insert_tasks" ON tasks;
DROP POLICY IF EXISTS "update_tasks" ON tasks;
DROP POLICY IF EXISTS "delete_tasks" ON tasks;


-- 4. Create NEW Policies using the helper function
-- PROJECTS
CREATE POLICY "access_projects" ON projects FOR ALL TO authenticated
USING (
    id IN (SELECT get_accessible_project_ids())
)
WITH CHECK (
    -- For insert/update, usually we want to allow creating (handled by RPC mostly)
    -- But standard insert should pass if user sets themselves as creator
    created_by = auth.uid() OR id IN (SELECT get_accessible_project_ids())
);

-- MEMBERS
CREATE POLICY "access_members" ON project_members FOR ALL TO authenticated
USING (
    project_id IN (SELECT get_accessible_project_ids())
)
WITH CHECK (
    project_id IN (SELECT get_accessible_project_ids())
);

-- TASKS
CREATE POLICY "access_tasks" ON tasks FOR ALL TO authenticated
USING (
    project_id IN (SELECT get_accessible_project_ids())
)
WITH CHECK (
    project_id IN (SELECT get_accessible_project_ids())
);


-- 5. Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 6. Verify data integrity (Fix any missing owner entries just in case)
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'owner'
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p.id AND pm.user_id = p.created_by
)
ON CONFLICT (project_id, user_id) DO NOTHING;
