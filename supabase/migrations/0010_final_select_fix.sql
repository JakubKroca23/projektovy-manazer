-- FINAL FIX: Simplify SELECT policies to avoid any timing/cache issues
-- This uses the most straightforward approach possible

-- ============================================================================
-- PROJECTS: Ultra-simple SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects" ON projects;

CREATE POLICY "View own and member projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    -- Option 1: I created it
    created_by = auth.uid()
    OR
    -- Option 2: I'm listed as a member
    id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TASKS: Ultra-simple SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view tasks" ON tasks;

CREATE POLICY "View project tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    -- I can see tasks if I can see the project
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.created_by = auth.uid()
      OR p.id IN (
        SELECT pm.project_id 
        FROM project_members pm 
        WHERE pm.user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PROJECT_MEMBERS: Ultra-simple SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "Users can view project members" ON project_members;

CREATE POLICY "View project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    -- I can see members if the project is mine or I'm a member
    project_id IN (
      SELECT p.id FROM projects p 
      WHERE p.created_by = auth.uid()
    )
    OR
    project_id IN (
      SELECT pm.project_id 
      FROM project_members pm 
      WHERE pm.user_id = auth.uid()
    )
  );
