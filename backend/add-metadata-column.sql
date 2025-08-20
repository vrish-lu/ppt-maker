-- Add missing columns to presentations table
-- This script adds the metadata and slides columns that are expected by the backend

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'presentations' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE presentations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        CREATE INDEX IF NOT EXISTS idx_presentations_metadata ON presentations USING GIN(metadata);
    END IF;
END $$;

-- Add slides column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'presentations' AND column_name = 'slides'
    ) THEN
        ALTER TABLE presentations ADD COLUMN slides JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add theme column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'presentations' AND column_name = 'theme'
    ) THEN
        ALTER TABLE presentations ADD COLUMN theme VARCHAR(100);
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'presentations' 
AND column_name IN ('metadata', 'slides', 'theme')
ORDER BY column_name; 