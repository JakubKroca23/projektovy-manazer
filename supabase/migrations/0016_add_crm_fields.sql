-- Add CRM fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS op_crm text,
ADD COLUMN IF NOT EXISTS project_manager text,
ADD COLUMN IF NOT EXISTS sector text,
ADD COLUMN IF NOT EXISTS customer text,
ADD COLUMN IF NOT EXISTS billing_company text,
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS quantity integer,
ADD COLUMN IF NOT EXISTS expected_start_date timestamptz,
ADD COLUMN IF NOT EXISTS deadline timestamptz,
ADD COLUMN IF NOT EXISTS completion_percentage integer,
ADD COLUMN IF NOT EXISTS required_action text,
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS assembly_company text,
ADD COLUMN IF NOT EXISTS job_description text,
ADD COLUMN IF NOT EXISTS op_opv_sro text,
ADD COLUMN IF NOT EXISTS op_group_zakaznik text,
ADD COLUMN IF NOT EXISTS ov_group_sro text,
ADD COLUMN IF NOT EXISTS zakazka_sro text;

-- Update RPC function to accept these new fields
-- We will use a JSONB parameter for the extra fields to keep the function signature clean and flexible
DROP FUNCTION IF EXISTS create_new_project;

CREATE OR REPLACE FUNCTION create_new_project(
  p_name text,
  p_description text,
  p_status text,
  p_extra_fields jsonb DEFAULT '{}'::jsonb
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

  INSERT INTO projects (
    name, 
    description, 
    status, 
    created_by,
    -- New fields mapped from JSONB
    op_crm,
    project_manager,
    sector,
    customer,
    billing_company,
    delivery_address,
    quantity,
    expected_start_date,
    deadline,
    completion_percentage,
    required_action,
    note,
    assembly_company,
    job_description,
    op_opv_sro,
    op_group_zakaznik,
    ov_group_sro,
    zakazka_sro
  )
  VALUES (
    p_name, 
    p_description, 
    p_status, 
    current_user_id,
    -- Extract values from JSONB
    p_extra_fields->>'op_crm',
    p_extra_fields->>'project_manager',
    p_extra_fields->>'sector',
    p_extra_fields->>'customer',
    p_extra_fields->>'billing_company',
    p_extra_fields->>'delivery_address',
    (p_extra_fields->>'quantity')::integer,
    (p_extra_fields->>'expected_start_date')::timestamptz,
    (p_extra_fields->>'deadline')::timestamptz,
    (p_extra_fields->>'completion_percentage')::integer,
    p_extra_fields->>'required_action',
    p_extra_fields->>'note',
    p_extra_fields->>'assembly_company',
    p_extra_fields->>'job_description',
    p_extra_fields->>'op_opv_sro',
    p_extra_fields->>'op_group_zakaznik',
    p_extra_fields->>'ov_group_sro',
    p_extra_fields->>'zakazka_sro'
  )
  RETURNING id INTO new_project_id;
  
  -- Add creator as owner
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (new_project_id, current_user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN json_build_object('id', new_project_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_new_project TO authenticated;
