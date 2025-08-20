-- Add new profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(255);

-- Update existing users to have default values
UPDATE users 
SET 
    bio = COALESCE(bio, ''),
    company = COALESCE(company, ''),
    role = COALESCE(role, '')
WHERE bio IS NULL OR company IS NULL OR role IS NULL; 