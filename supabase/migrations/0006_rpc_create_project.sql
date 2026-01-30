-- Create a RPC function to create projects securely, bypassing RLS
-- This function guarantees that the project is created regardless of RLS complexity on the table

create or replace function public.create_new_project(
  p_name text,
  p_description text,
  p_status text
)
returns json
language plpgsql
security definer -- Run as database owner (bypasses RLS)
set search_path = public
as $$
declare
  new_project_id uuid;
  current_user_id uuid;
begin
  current_user_id := auth.uid();
  
  if current_user_id is null then
    raise exception 'User is not authenticated';
  end if;

  -- Insert the project
  -- RLS is bypassed because of SECURITY DEFINER
  insert into public.projects (name, description, status, created_by)
  values (p_name, p_description, p_status, current_user_id)
  returning id into new_project_id;
  
  -- The trigger 'on_project_created' (from migration 0005) will automatically 
  -- add the creator as the 'owner' in project_members.
  -- Since triggers inherit the context, and we are in SECURITY DEFINER context,
  -- the trigger will also bypass RLS on project_members.
  
  return json_build_object('id', new_project_id);
end;
$$;

-- Grant access to the function
grant execute on function public.create_new_project to authenticated;
