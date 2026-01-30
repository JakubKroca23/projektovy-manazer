-- Add start_date column to tasks table for Gantt chart scheduling
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone;

-- Update RLS policies if needed (existing update policy usually covers all columns, but good to check)
-- The existing policy "Assigned users and project admins can update tasks" covers updates regardless of columns.
