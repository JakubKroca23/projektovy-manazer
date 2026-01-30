-- Project Manager Database Schema for Supabase
-- Hierarchy: Users (via auth.users) → Projects → Contracts → Tasks

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar TEXT,
  role INT DEFAULT 2, -- 0=ADMIN, 1=MANAGER, 2=MEMBER
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status INT DEFAULT 0, -- 0=PLANNING, 1=TODO, 2=IN_PROGRESS, 3=REVIEW, 4=COMPLETED, 5=CANCELLED
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Members table - for team management
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role INT DEFAULT 2, -- 0=OWNER, 1=MANAGER, 2=MEMBER, 3=VIEWER
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Contracts table (zakázky - sub-projects)
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status INT DEFAULT 0, -- 0=PLANNING, 1=TODO, 2=IN_PROGRESS, 3=REVIEW, 4=COMPLETED, 5=CANCELLED
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status INT DEFAULT 1, -- 0=PLANNING, 1=TODO, 2=IN_PROGRESS, 3=REVIEW, 4=COMPLETED, 5=CANCELLED
  progress INT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File Uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size INT NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects RLS Policies
CREATE POLICY "Users can view projects they own or are members of" ON public.projects FOR SELECT USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Project owners can update their projects" ON public.projects FOR UPDATE USING (
  auth.uid() = created_by OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid() AND role <= 1
  )
);

-- Project Members RLS Policies
CREATE POLICY "Project members can view membership" ON public.project_members FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.project_members AS pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
  )
);

-- Contracts RLS Policies
CREATE POLICY "Users can view contracts for their projects" ON public.contracts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = contracts.project_id AND (
      projects.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
      )
    )
  )
);

-- Tasks RLS Policies
CREATE POLICY "Users can view tasks in their contracts" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contracts 
    JOIN public.projects ON projects.id = contracts.project_id
    WHERE contracts.id = tasks.contract_id AND (
      projects.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
      )
    )
  )
);

-- Task Comments RLS Policies
CREATE POLICY "Users can view comments on their tasks" ON public.task_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    JOIN public.contracts ON contracts.id = tasks.contract_id
    JOIN public.projects ON projects.id = contracts.project_id
    WHERE tasks.id = task_comments.task_id AND (
      projects.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
      )
    )
  )
);

-- File Uploads RLS Policies
CREATE POLICY "Users can view files in their projects" ON public.file_uploads FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE projects.id = file_uploads.project_id AND (
      projects.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.project_members WHERE project_members.project_id = projects.id AND project_members.user_id = auth.uid()
      )
    )
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contract_id ON public.tasks(contract_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project_id ON public.file_uploads(project_id);
