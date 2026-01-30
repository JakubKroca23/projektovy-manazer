-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create a helper function that bypasses RLS
create or replace function get_auth_user_project_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select project_id from project_members where user_id = auth.uid()
  union
  select id from projects where created_by = auth.uid();
$$;

-- 2. Drop existing problematic policies on project_members
drop policy if exists "Users can view project members for their projects" on public.project_members;
drop policy if exists "Project owners and admins can add members" on public.project_members;
drop policy if exists "Project owners and admins can update members" on public.project_members;
drop policy if exists "Project owners and admins can remove members" on public.project_members;

-- 3. Re-create policies using the helper function

-- SELECT: Users can view members if they belong to the project
create policy "Users can view project members"
  on public.project_members for select
  using (
    project_id in (select get_auth_user_project_ids())
  );

-- INSERT: Only Project Owners and Admins can insert members
-- (Also allows Project Creator to insert the first member - themselves)
create policy "Project admins can add members"
  on public.project_members for insert
  with check (
    -- Check if user is admin/owner via existing membership
    exists (
      select 1 from public.project_members
      where project_id = project_members.project_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
    -- OR if user created the project (needed for initial insert)
    or exists (
      select 1 from public.projects
      where id = project_members.project_id
      and created_by = auth.uid()
    )
  );

-- UPDATE: Only Project Owners and Admins can update members
create policy "Project admins can update members"
  on public.project_members for update
  using (
    exists (
      select 1 from public.project_members
      where project_id = project_members.project_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.projects
      where id = project_members.project_id
      and created_by = auth.uid()
    )
  );

-- DELETE: Only Project Owners and Admins can remove members
create policy "Project admins can remove members"
  on public.project_members for delete
  using (
    exists (
      select 1 from public.project_members
      where project_id = project_members.project_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
    )
    or exists (
      select 1 from public.projects
      where id = project_members.project_id
      and created_by = auth.uid()
    )
  );
