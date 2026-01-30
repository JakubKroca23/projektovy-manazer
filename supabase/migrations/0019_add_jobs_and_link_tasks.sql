-- Create jobs table
CREATE TABLE public.jobs (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    order_number text,
    order_date date,
    deadline date,
    expected_completion_date date,
    actual_completion_date date,
    status text CHECK (status IN ('planning', 'in_production', 'done', 'delivered', 'canceled')) DEFAULT 'planning',
    completion_percentage integer DEFAULT 0,
    note text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add job_id to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Updates triggers
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Policies for jobs
CREATE POLICY "Users can view jobs for accessible projects"
  ON public.jobs FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      created_by = auth.uid() OR 
      id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project members can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      created_by = auth.uid() OR 
      id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Project admins can update jobs"
  ON public.jobs FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      created_by = auth.uid() OR 
      id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );
  
CREATE POLICY "Project owners can delete jobs"
  ON public.jobs FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE 
      created_by = auth.uid() OR 
      id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role = 'owner')
    )
  );
