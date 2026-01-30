-- Fix Project Creation & Membership by using Triggers
-- Instead of relying on client-side inserts (which can fail RLS), we do it automatically in DB.

-- 1. Create function to add creator as owner
create or replace function public.add_project_creator_as_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

-- 2. Create trigger
drop trigger if exists on_project_created on public.projects;
create trigger on_project_created
  after insert on public.projects
  for each row execute procedure public.add_project_creator_as_owner();

-- 3. Fix existing projects (Backfill missing owners)
-- If there are projects where creator is not in project_members, add them.
insert into public.project_members (project_id, user_id, role)
select p.id, p.created_by, 'owner'
from public.projects p
where not exists (
  select 1 from public.project_members pm
  where pm.project_id = p.id
  and pm.user_id = p.created_by
);

-- 4. Simplify RLS for Insert (Optional but good)
-- We can simplify the project_members insert policy since creators are now added by trigger
-- So only existing admins need permission to add OTHERS.

drop policy if exists "Users can add project members" on public.project_members;
create policy "Users can add project members" 
  on public.project_members for insert 
  with check (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin')
    )
  );
