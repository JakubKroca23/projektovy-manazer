-- Create services table for standalone service events
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  status text DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Users can view all services" ON services FOR SELECT USING (true);
CREATE POLICY "Users can create services" ON services FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update services" ON services FOR UPDATE USING (true);
CREATE POLICY "Users can delete services" ON services FOR DELETE USING (true);

-- Allow tasks to exist without a project (independent tasks)
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- Add link to services for tasks (optional, if tasks belong to services)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id) ON DELETE CASCADE;
