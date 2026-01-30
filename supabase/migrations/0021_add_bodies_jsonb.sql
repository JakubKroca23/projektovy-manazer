-- Add bodies jsonb column to projects for dynamic superstructures
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS bodies jsonb DEFAULT '[]'::jsonb;

-- Update create_new_project function to include bodies
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
    zakazka_sro,
    vehicle_config,
    vehicle_brand,
    -- Legacy columns kept for compatibility but data prioritized from extra_fields if needed or separate columns
    -- body_type, crane_type, outriggers_type, pump_type are now less relevant with 'bodies' but we can still populate them if single value provided
    body_type,
    crane_type,
    outriggers_type,
    pump_type,
    accessories,
    bodies
  )
  VALUES (
    p_name, 
    p_description, 
    p_status, 
    current_user_id,
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
    p_extra_fields->>'zakazka_sro',
    p_extra_fields->>'vehicle_config',
    p_extra_fields->>'vehicle_brand',
    p_extra_fields->>'body_type',
    p_extra_fields->>'crane_type',
    p_extra_fields->>'outriggers_type',
    p_extra_fields->>'pump_type',
    COALESCE(p_extra_fields->'accessories', '[]'::jsonb),
    COALESCE(p_extra_fields->'bodies', '[]'::jsonb)
  )
  RETURNING id INTO new_project_id;
  
  -- Add creator as owner
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (new_project_id, current_user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  RETURN json_build_object('id', new_project_id);
END;
$$;
