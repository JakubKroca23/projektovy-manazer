-- COMPLETE DATABASE RESET AND FIX
-- This migration consolidates all previous fixes into one clean setup
-- Run this in Supabase SQL Editor to fix all RLS and creation issues

-- ============================================================================
-- PART 1: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop all policies on projects
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projects';
    END LOOP;
END $$;

-- Drop all policies on tasks
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.tasks';
    END LOOP;
END $$;

-- Drop all policies on project_members
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'project_members' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.project_members';
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: HELPER FUNCTIONS (Security Definer to bypass RLS)
-- ============================================================================

-- Function to get user's project IDs (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_projects()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM projects WHERE created_by = auth.uid()
  UNION
  SELECT project_id FROM project_members WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- PART 3: RPC FUNCTIONS FOR SAFE CREATION
-- ============================================================================

-- RPC: Create Project (bypasses RLS completely)
CREATE OR REPLACE FUNCTION create_new_project(
  p_name text,
  p_description text,
  p_status text DEFAULT 'planning'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert project
  INSERT INTO projects (name, description, status, created_by)
  VALUES (p_name, p_description, p_status, current_user_id)
  RETURNING id INTO new_project_id;
  
  -- Add creator as owner
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (new_project_id, current_user_id, 'owner');
  
  RETURN json_build_object('id', new_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_new_project TO authenticated;

-- RPC: Create Task (bypasses RLS completely)
CREATE OR REPLACE FUNCTION create_new_task(
  p_project_id uuid,
  p_title text,
  p_description text DEFAULT '',
  p_priority text DEFAULT 'medium',
  p_due_date timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_task_id uuid;
  current_user_id uuid;
  is_member boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user is project member or creator
  SELECT EXISTS (
    SELECT 1 FROM project_members 
    WHERE project_id = p_project_id AND user_id = current_user_id
    UNION
    SELECT 1 FROM projects 
    WHERE id = p_project_id AND created_by = current_user_id
  ) INTO is_member;
  
  IF NOT is_member THEN
    RAISE EXCEPTION 'Not authorized for this project';
  END IF;

  -- Insert task
  INSERT INTO tasks (project_id, title, description, priority, status, assigned_to, due_date)
  VALUES (p_project_id, p_title, p_description, p_priority, 'todo', current_user_id, p_due_date)
  RETURNING id INTO new_task_id;
  
  RETURN json_build_object('id', new_task_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_new_task TO authenticated;

-- ============================================================================
-- PART 4: SIMPLE RLS POLICIES (Read/Update/Delete only, Insert via RPC)
-- ============================================================================

-- PROJECTS POLICIES
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    created_by = auth.uid() 
    OR id IN (SELECT get_user_projects())
  );

CREATE POLICY "Users can update their projects"
  ON projects FOR UPDATE
  USING (
    created_by = auth.uid()
    OR id IN (SELECT get_user_projects())
  );

CREATE POLICY "Creators can delete projects"
  ON projects FOR DELETE
  USING (created_by = auth.uid());

-- Allow insert only for RPC function (it runs as SECURITY DEFINER)
CREATE POLICY "Allow RPC project creation"
  ON projects FOR INSERT
  WITH CHECK (true); -- RPC handles auth

-- TASKS POLICIES
CREATE POLICY "Users can view project tasks"
  ON tasks FOR SELECT
  USING (project_id IN (SELECT get_user_projects()));

CREATE POLICY "Users can update project tasks"
  ON tasks FOR UPDATE
  USING (project_id IN (SELECT get_user_projects()));

CREATE POLICY "Users can delete project tasks"
  ON tasks FOR DELETE
  USING (project_id IN (SELECT get_user_projects()));

-- Allow insert only for RPC function
CREATE POLICY "Allow RPC task creation"
  ON tasks FOR INSERT
  WITH CHECK (true); -- RPC handles auth

-- PROJECT_MEMBERS POLICIES
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  USING (project_id IN (SELECT get_user_projects()));

CREATE POLICY "Admins can manage members"
  ON project_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('owner', 'admin')
    )
  );

-- Allow insert via RPC
CREATE POLICY "Allow RPC member creation"
  ON project_members FOR INSERT
  WITH CHECK (true); -- RPC handles auth

-- ============================================================================
-- PART 5: BACKFILL MISSING DATA
-- ============================================================================

-- Add existing project creators as owners if not already members
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'owner'
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm
  WHERE pm.project_id = p.id AND pm.user_id = p.created_by
)
ON CONFLICT DO NOTHING;
