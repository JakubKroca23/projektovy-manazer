-- Fix duplicate member insertion
-- Remove old trigger and fix RPC function

-- 1. Drop the old trigger (from migration 0005)
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP FUNCTION IF EXISTS public.add_project_creator_as_owner();

-- 2. Update RPC function to handle conflicts gracefully
CREATE OR REPLACE FUNCTION create_new_project(
  p_name text,
  p_description text,
  p_status text DEFAULT 'planning'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_project_id uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert project
  INSERT INTO projects (name, description, status, created_by)
  VALUES (p_name, p_description, p_status, current_user_id)
  RETURNING id INTO new_project_id;
  
  -- Add creator as owner (with conflict handling)
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (new_project_id, current_user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN json_build_object('id', new_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_new_project TO authenticated;
