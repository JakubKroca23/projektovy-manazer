-- FIX: SELECT Policies - pouze zobrazení dat
-- Tento skript opraví RLS policies pro čtení (SELECT)
-- Spusťte jej DODATEČNĚ k předchozímu 0007_complete_reset.sql

-- ============================================================================
-- PART 1: Fix SELECT Policies - Remove Circular Dependencies
-- ============================================================================

-- Drop and recreate SELECT policies with simpler logic

-- PROJECTS: Simplified SELECT
DROP POLICY IF EXISTS "Users can view their projects" ON projects;
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    -- Vidím jako creator
    created_by = auth.uid()
    OR
    -- Vidím jako člen (direct check bez funkce)
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
    )
  );

-- PROJECT_MEMBERS: Allow viewing own memberships
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (
    -- Vidím všechny členství ve svých projektech
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
    OR
    -- Vidím členství v projektech, kde jsem členem
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- TASKS: Simplified SELECT
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
CREATE POLICY "Users can view project tasks"
  ON tasks FOR SELECT
  USING (
    -- Vidím úkoly projektů, které jsem vytvořil
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
    OR
    -- Vidím úkoly projektů, kde jsem členem
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 2: Ensure RLS is enabled
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
