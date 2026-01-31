-- Migration: Add settings field to profiles table

-- Add a JSONB column to store user settings
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Optional: Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_settings ON profiles USING gin(settings);

-- Example settings structure:
-- {
--   "emailNotifications": true,
--   "inAppAlerts": true,
--   "dateFormat": "DD/MM/YYYY",
--   "firstDayOfWeek": 1,
--   "defaultView": "timeline",
--   "autoExpandProjects": true
-- }
