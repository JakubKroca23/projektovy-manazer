-- Complete fix for RLS infinite recursion
-- Updates 'projects' and 'tasks' policies to use the secure helper function
-- This breaks the circular dependency: projects -> project_members -> projects

-- 1. Update PROJECTS policies
drop policy if exists "Users can view projects they are members of" on public.projects;

create policy "Users can view projects"
  on public.projects for select
  using (
    id in (select get_auth_user_project_ids())
  );

-- 2. Update TASKS policies
drop policy if exists "Users can view tasks in their projects" on public.tasks;
drop policy if exists "Project members can create tasks" on public.tasks;

create policy "Users can view tasks"
  on public.tasks for select
  using (
    project_id in (select get_auth_user_project_ids())
  );

create policy "Users can create tasks"
  on public.tasks for insert
  with check (
    project_id in (select get_auth_user_project_ids())
  );
