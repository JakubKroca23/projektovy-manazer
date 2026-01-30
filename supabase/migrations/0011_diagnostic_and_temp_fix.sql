-- DIAGNOSTIC & NUCLEAR FIX
-- This will help us see what's wrong and then fix it

-- ============================================================================
-- STEP 1: CHECK DATA (run this in SQL editor and look at results)
-- ============================================================================
-- Check if you have projects
SELECT id, name, created_by FROM projects WHERE created_by = auth.uid();

-- Check if you have memberships
SELECT * FROM project_members WHERE user_id = auth.uid();

-- Check for any orphaned projects (created but no membership)
SELECT p.id, p.name 
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = p.created_by
WHERE p.created_by = auth.uid()
AND pm.id IS NULL;

-- ============================================================================
-- STEP 2: FIX ORPHANED PROJECTS (add missing memberships)
-- ============================================================================
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'owner'
FROM projects p
LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = p.created_by
WHERE pm.id IS NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ============================================================================
-- STEP 3: NUCLEAR OPTION - Temporarily allow ALL authenticated users to see ALL projects
-- (Just for testing - we'll fix it properly after confirming it works)
-- ============================================================================
DROP POLICY IF EXISTS "View own and member projects" ON projects;
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;

-- TEMPORARY: Allow all authenticated users to see all projects
CREATE POLICY "temp_view_all_projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

-- TEMPORARY: Allow all authenticated users to see all tasks
DROP POLICY IF EXISTS "View project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;

CREATE POLICY "temp_view_all_tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

-- TEMPORARY: Allow all authenticated users to see all members
DROP POLICY IF EXISTS "View project members" ON project_members;
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

CREATE POLICY "temp_view_all_members"
  ON project_members FOR SELECT
  TO authenticated
  USING (true);
