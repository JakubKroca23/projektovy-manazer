-- NUCLEAR OPTION: Disable RLS completely for testing
-- This will show us if the problem is RLS or data

-- Disable RLS on all tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT 'PROJECTS:' as table_name, COUNT(*) as count FROM projects;
SELECT 'MEMBERS:' as table_name, COUNT(*) as count FROM project_members;  
SELECT 'TASKS:' as table_name, COUNT(*) as count FROM tasks;

-- Show actual data
SELECT id, name, created_by, created_at FROM projects ORDER BY created_at DESC LIMIT 5;
