-- Enable Row Level Security
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    company VARCHAR(255),
    role VARCHAR(255),
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}'::jsonb,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    api_usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create presentations table
CREATE TABLE IF NOT EXISTS presentations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    theme VARCHAR(100) NOT NULL,
    slides JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table (for individual slide management)
CREATE TABLE IF NOT EXISTS slides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    slide_index INTEGER NOT NULL,
    title VARCHAR(500),
    content JSONB DEFAULT '{}'::jsonb,
    layout VARCHAR(50) DEFAULT 'image-left',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assets table (for images and other files)
CREATE TABLE IF NOT EXISTS assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_updated_at ON presentations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_slide_index ON slides(presentation_id, slide_index);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_presentation_id ON assets(presentation_id);

-- Row Level Security Policies

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Presentations table policies
CREATE POLICY "Users can view own presentations" ON presentations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presentations" ON presentations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presentations" ON presentations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presentations" ON presentations
    FOR DELETE USING (auth.uid() = user_id);

-- Slides table policies
CREATE POLICY "Users can view slides of own presentations" ON slides
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = slides.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert slides to own presentations" ON slides
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = slides.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update slides of own presentations" ON slides
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = slides.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete slides of own presentations" ON slides
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM presentations 
            WHERE presentations.id = slides.presentation_id 
            AND presentations.user_id = auth.uid()
        )
    );

-- Assets table policies
CREATE POLICY "Users can view own assets" ON assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON assets
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON presentations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 