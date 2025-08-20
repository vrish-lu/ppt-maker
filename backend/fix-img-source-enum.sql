-- Fix img_source enum to include 'None' value
-- This script updates the existing enum to include 'None' as a valid option

-- First, create a new enum with all values
CREATE TYPE img_source_new AS ENUM ('ai', 'None');

-- Update the presentations table to use the new enum
ALTER TABLE presentations 
  ALTER COLUMN image_source TYPE img_source_new 
  USING image_source::text::img_source_new;

-- Drop the old enum
DROP TYPE img_source;

-- Rename the new enum to the original name
ALTER TYPE img_source_new RENAME TO img_source;

-- Set default value back to 'ai'
ALTER TABLE presentations ALTER COLUMN image_source SET DEFAULT 'ai';
