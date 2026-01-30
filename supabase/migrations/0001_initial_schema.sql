-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text check (role in ('admin', 'manager', 'member')) default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  status text check (status in ('planning', 'active', 'completed', 'archived')) default 'planning',
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'review', 'done')) default 'todo',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create project_members table
create table public.project_members (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member', 'viewer')) default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(project_id, user_id)
);

-- Create indexes
create index projects_created_by_idx on public.projects(created_by);
create index tasks_project_id_idx on public.tasks(project_id);
create index tasks_assigned_to_idx on public.tasks(assigned_to);
create index project_members_project_id_idx on public.project_members(project_id);
create index project_members_user_id_idx on public.project_members(user_id);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.project_members enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects policies
create policy "Users can view projects they are members of"
  on public.projects for select
  using (
    auth.uid() in (
      select user_id from public.project_members
      where project_id = projects.id
    )
    or created_by = auth.uid()
  );

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() = created_by);

create policy "Project owners and admins can update projects"
  on public.projects for update
  using (
    auth.uid() in (
      select user_id from public.project_members
      where project_id = projects.id 
      and role in ('owner', 'admin')
    )
    or created_by = auth.uid()
  );

create policy "Only project owners can delete projects"
  on public.projects for delete
  using (
    auth.uid() in (
      select user_id from public.project_members
      where project_id = projects.id 
      and role = 'owner'
    )
    or created_by = auth.uid()
  );

-- Tasks policies
create policy "Users can view tasks in their projects"
  on public.tasks for select
  using (
    project_id in (
      select project_id from public.project_members
      where user_id = auth.uid()
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Project members can create tasks"
  on public.tasks for insert
  with check (
    project_id in (
      select project_id from public.project_members
      where user_id = auth.uid()
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Assigned users and project admins can update tasks"
  on public.tasks for update
  using (
    assigned_to = auth.uid()
    or project_id in (
      select project_id from public.project_members
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Project owners and admins can delete tasks"
  on public.tasks for delete
  using (
    project_id in (
      select project_id from public.project_members
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

-- Project members policies
create policy "Users can view project members for their projects"
  on public.project_members for select
  using (
    project_id in (
      select project_id from public.project_members
      where user_id = auth.uid()
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Project owners and admins can add members"
  on public.project_members for insert
  with check (
    project_id in (
      select project_id from public.project_members
      where user_id = auth.uid() 
      and role in ('owner', 'admin')
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Project owners and admins can update members"
  on public.project_members for update
  using (
    project_id in (
      select project_id from public.project_members pm
      where pm.user_id = auth.uid() 
      and pm.role in ('owner', 'admin')
      and pm.project_id = project_members.project_id
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

create policy "Project owners and admins can remove members"
  on public.project_members for delete
  using (
    project_id in (
      select project_id from public.project_members pm
      where pm.user_id = auth.uid() 
      and pm.role in ('owner', 'admin')
      and pm.project_id = project_members.project_id
    )
    or project_id in (
      select id from public.projects
      where created_by = auth.uid()
    )
  );

-- Function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add update triggers
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute procedure update_updated_at_column();

create trigger update_projects_updated_at before update on public.projects
  for each row execute procedure update_updated_at_column();

create trigger update_tasks_updated_at before update on public.tasks
  for each row execute procedure update_updated_at_column();
