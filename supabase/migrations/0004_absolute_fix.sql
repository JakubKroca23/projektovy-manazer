-- ABSOLUTE FIX for RLS Policies
-- This script drops ALL policies for the main tables and recreates them from scratch.
-- It resolves the circular dependency and fix the insert violation.

-- 1. Helper function (Security Definer to bypass RLS)
create or replace function get_auth_user_project_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  -- Projekty, kde jsem členem
  select project_id from project_members where user_id = auth.uid()
  union
  -- Projekty, které jsem vytvořil
  select id from projects where created_by = auth.uid();
$$;

-- 2. Drop execute permissions on the function just in case, then regrant
revoke execute on function get_auth_user_project_ids from public;
grant execute on function get_auth_user_project_ids to authenticated;
grant execute on function get_auth_user_project_ids to service_role;


-- 3. Reset PROJECTS policies
drop policy if exists "Authenticated users can create projects" on public.projects;
drop policy if exists "Users can view projects they are members of" on public.projects;
drop policy if exists "Users can view projects" on public.projects;
drop policy if exists "Project owners and admins can update projects" on public.projects;
drop policy if exists "Only project owners can delete projects" on public.projects;

-- New Projects Policies
create policy "Users can create projects" 
  on public.projects for insert 
  to authenticated 
  with check (auth.uid() = created_by);

create policy "Users can view projects" 
  on public.projects for select 
  using (
    -- Vidím své vlastní projekty (bez volání funkce, pro rychlost a jistotu)
    created_by = auth.uid()
    or
    -- Vidím projekty, kde jsem členem (přes bezpečnou funkci)
    id in (select get_auth_user_project_ids())
  );

create policy "Users can update projects" 
  on public.projects for update
  using (
    created_by = auth.uid()
    or id in (select get_auth_user_project_ids())
  );

create policy "Users can delete projects" 
  on public.projects for delete
  using (
    created_by = auth.uid()
  );


-- 4. Reset PROJECT_MEMBERS policies
drop policy if exists "Users can view project members for their projects" on public.project_members;
drop policy if exists "Users can view project members" on public.project_members;
drop policy if exists "Project owners and admins can add members" on public.project_members;
drop policy if exists "Project admins can add members" on public.project_members;
drop policy if exists "Project owners and admins can update members" on public.project_members;
drop policy if exists "Project admins can update members" on public.project_members;
drop policy if exists "Project owners and admins can remove members" on public.project_members;
drop policy if exists "Project admins can remove members" on public.project_members;

-- New Project Members Policies
create policy "Users can view project members" 
  on public.project_members for select 
  using (
    -- Vidím členy projektů, ke kterým mám přístup
    project_id in (select get_auth_user_project_ids())
  );

create policy "Users can add project members" 
  on public.project_members for insert 
  with check (
    -- Owner/Admin existujícího projektu může přidat další
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin')
    )
    -- NEBO: Tvůrce projektu může přidat prvního člena (sebe)
    or exists (
      select 1 from projects p
      where p.id = project_members.project_id
      and p.created_by = auth.uid()
    )
  );

create policy "Users can update project members" 
  on public.project_members for update 
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin')
    )
  );

create policy "Users can delete project members" 
  on public.project_members for delete 
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin')
    )
    or exists (
        select 1 from projects p
        where p.id = project_members.project_id
        and p.created_by = auth.uid()
    )
  );


-- 5. Reset TASKS policies
drop policy if exists "Users can view tasks in their projects" on public.tasks;
drop policy if exists "Users can view tasks" on public.tasks;
drop policy if exists "Project members can create tasks" on public.tasks;
drop policy if exists "Users can create tasks" on public.tasks;
drop policy if exists "Assigned users and project admins can update tasks" on public.tasks;
drop policy if exists "Project owners and admins can delete tasks" on public.tasks;

-- New Tasks Policies
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

create policy "Users can update tasks" 
  on public.tasks for update 
  using (
    project_id in (select get_auth_user_project_ids())
  );

create policy "Users can delete tasks" 
  on public.tasks for delete 
  using (
     project_id in (select get_auth_user_project_ids())
  );
