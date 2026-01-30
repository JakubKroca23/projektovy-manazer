-- ============================================================================
-- COMPLETE DIAGNOSTIC AND FINAL FIX
-- Run this entire script in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check current user and projects
DO $$
DECLARE
    current_uid uuid;
    project_count int;
    member_count int;
BEGIN
    current_uid := auth.uid();
    
    SELECT COUNT(*) INTO project_count FROM projects WHERE created_by = current_uid;
    SELECT COUNT(*) INTO member_count FROM project_members WHERE user_id = current_uid;
    
    RAISE NOTICE 'Current user ID: %', current_uid;
    RAISE NOTICE 'Projects created: %', project_count;
    RAISE NOTICE 'Memberships: %', member_count;
END $$;

-- STEP 2: Fix missing memberships
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.created_by, 'owner'
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p.id AND pm.user_id = p.created_by
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- STEP 3: Drop ALL existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
    -- Drop all project policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projects';
    END LOOP;
    
    -- Drop all task policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.tasks';
    END LOOP;
    
    -- Drop all project_members policies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'project_members' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.project_members';
    END LOOP;
END $$;

-- STEP 4: Create SIMPLE, WORKING policies

-- PROJECTS: Super simple - creator OR member
CREATE POLICY "view_projects" ON projects FOR SELECT TO authenticated
USING (
    created_by = auth.uid() 
    OR 
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

CREATE POLICY "update_projects" ON projects FOR UPDATE TO authenticated
USING (
    created_by = auth.uid()
    OR
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "delete_projects" ON projects FOR DELETE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "insert_projects" ON projects FOR INSERT TO authenticated
WITH CHECK (true);

-- PROJECT_MEMBERS: Simple visibility
CREATE POLICY "view_members" ON project_members FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

CREATE POLICY "insert_members" ON project_members FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "update_members" ON project_members FOR UPDATE TO authenticated
USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

CREATE POLICY "delete_members" ON project_members FOR DELETE TO authenticated
USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- TASKS: Simple - visible if project is visible
CREATE POLICY "view_tasks" ON tasks FOR SELECT TO authenticated
USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

CREATE POLICY "insert_tasks" ON tasks FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "update_tasks" ON tasks FOR UPDATE TO authenticated
USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

CREATE POLICY "delete_tasks" ON tasks FOR DELETE TO authenticated
USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
);

-- STEP 5: Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify setup
SELECT 'Setup complete!' as status;
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as total_members FROM project_members;
SELECT COUNT(*) as total_tasks FROM tasks;
