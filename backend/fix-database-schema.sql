-- Fix database schema for presentations table
-- This script adds the missing theme column that the backend expects

-- Add theme column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'presentations' AND column_name = 'theme'
    ) THEN
        ALTER TABLE presentations ADD COLUMN theme VARCHAR(100);
        RAISE NOTICE 'Added theme column to presentations table';
    ELSE
        RAISE NOTICE 'theme column already exists in presentations table';
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
        RAISE NOTICE 'Added slides column to presentations table';
    ELSE
        RAISE NOTICE 'slides column already exists in presentations table';
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'presentations' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE presentations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        CREATE INDEX IF NOT EXISTS idx_presentations_metadata ON presentations USING GIN(metadata);
        RAISE NOTICE 'Added metadata column to presentations table';
    ELSE
        RAISE NOTICE 'metadata column already exists in presentations table';
    END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'presentations' 
AND column_name IN ('theme', 'slides', 'metadata')
ORDER BY column_name; 