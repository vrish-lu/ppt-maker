-- =========================
-- Extensions
-- =========================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =========================
-- ENUMS
-- =========================
-- Amount Of Text
DROP TYPE IF EXISTS amount_of_text_enum CASCADE;
CREATE TYPE amount_of_text_enum AS ENUM ('minimal', 'concise', 'detailed', 'extensive');

-- Image Source
DROP TYPE IF EXISTS img_source CASCADE;
CREATE TYPE img_source AS ENUM ('ai', 'None');

-- Subscription Tier
DROP TYPE IF EXISTS sub_tier CASCADE;
CREATE TYPE sub_tier AS ENUM ('free', 'paid');

-- Slide Layout
DROP TYPE IF EXISTS slide_layout CASCADE;
CREATE TYPE slide_layout AS ENUM ('image-left', 'image-right');

-- Share Access Level
DROP TYPE IF EXISTS share_access_level CASCADE;
CREATE TYPE share_access_level AS ENUM ('view', 'edit');

-- Template Category
DROP TYPE IF EXISTS template_category CASCADE;
CREATE TYPE template_category AS ENUM ('business', 'education', 'creative');

-- =====================================================
-- TABLES
-- =====================================================
-- Users Table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	display_name TEXT,
	avatar_url TEXT,
	preferences JSONB DEFAULT '{}', -- Store user preferences
	subscription_tier sub_tier NOT NULL DEFAULT 'free',
	api_usage_count INTEGER NOT NULL DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Presentations table - Main presentation metadata
DROP TABLE IF EXISTS presentations CASCADE;
CREATE TABLE presentations (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id UUID REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	description TEXT,
	theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
	amount_of_text amount_of_text_enum NOT NULL DEFAULT 'detailed',
	image_source img_source NOT NULL DEFAULT 'ai',
	image_style TEXT,
	slide_count INTEGER NOT NULL DEFAULT 5,
	is_public BOOLEAN NOT NULL DEFAULT false,
	is_template BOOLEAN NOT NULL DEFAULT false,
	tags TEXT[] DEFAULT '{}',
	view_count INTEGER NOT NULL DEFAULT 0,
	like_count INTEGER NOT NULL DEFAULT 0,
	slides JSONB DEFAULT '[]'::jsonb,
	metadata JSONB DEFAULT '{}'::jsonb,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Themes
DROP TABLE IF EXISTS themes CASCADE;
CREATE TABLE themes (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	background_color TEXT,
	text_color TEXT,
	font_family TEXT,
	font_size TEXT,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Slides table - Individual slide content
DROP TABLE IF EXISTS slides CASCADE;
CREATE TABLE slides (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
	theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
	title TEXT NOT NULL,
	content JSONB NOT NULL DEFAULT '{}', -- Store bullets, layout, theme info, custom styling
	layout slide_layout NOT NULL DEFAULT 'image-left',
	slide_order INTEGER NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
	-- UNIQUE(presentation_id, slide_order)
);

-- Images table - Image metadata and storage references
DROP TABLE IF EXISTS presentation_images CASCADE;
CREATE TABLE presentation_images (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
	slide_id UUID REFERENCES slides(id) ON DELETE CASCADE,
	storage_path TEXT NOT NULL,
	image_url TEXT NOT NULL,
	alt_text TEXT,
	image_style TEXT,
	prompt_used TEXT,
	is_ai_generated BOOLEAN DEFAULT true,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Presentation sharing links
DROP TABLE IF EXISTS presentation_shares CASCADE;
CREATE TABLE presentation_shares (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
	share_token TEXT UNIQUE NOT NULL,
	access_level share_access_level NOT NULL DEFAULT 'view', -- 'view', 'edit'
	created_by UUID REFERENCES users(id) ON DELETE CASCADE,
	expires_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Presentation templates
DROP TABLE IF EXISTS presentation_templates CASCADE;
CREATE TABLE presentation_templates (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	category template_category,
	theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
	preview_image_url TEXT,
	is_official BOOLEAN DEFAULT false,
	created_by UUID REFERENCES users(id),
	usage_count INTEGER DEFAULT 0,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- Template slides
DROP TABLE IF EXISTS template_slides CASCADE;
CREATE TABLE template_slides (
	id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
	template_id UUID REFERENCES presentation_templates(id) ON DELETE CASCADE,
	title TEXT NOT NULL,
	content JSONB NOT NULL DEFAULT '{}',
	layout slide_layout DEFAULT 'image-left',
	slide_order INTEGER NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW()),
	updated_at TIMESTAMP NOT NULL DEFAULT TIMEZONE('Asia/Kolkata', NOW())
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Presentations indexes
CREATE INDEX idx_presentations_user_id ON presentations(user_id);
CREATE INDEX idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX idx_presentations_theme_id ON presentations(theme_id);
CREATE INDEX idx_presentations_public ON presentations(is_public) WHERE is_public = true;
CREATE INDEX idx_presentations_tags ON presentations USING GIN(tags);
CREATE INDEX idx_presentations_metadata ON presentations USING GIN(metadata);

-- Slides indexes
CREATE INDEX idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX idx_slides_order ON slides(presentation_id, slide_order);
CREATE INDEX idx_slides_theme_id ON slides(theme_id);

-- Images indexes
CREATE INDEX idx_presentation_images_presentation_id ON presentation_images(presentation_id);
CREATE INDEX idx_presentation_images_slide_id ON presentation_images(slide_id);

-- Shares indexes
CREATE INDEX idx_presentation_shares_token ON presentation_shares(share_token);
CREATE INDEX idx_presentation_shares_presentation_id ON presentation_shares(presentation_id);

-- Templates indexes
CREATE INDEX idx_presentation_templates_category ON presentation_templates(category);
CREATE INDEX idx_presentation_templates_theme_id ON presentation_templates(theme_id);

-- Create search index
CREATE INDEX idx_presentations_search ON presentations USING GIN(search_vector);

-- =====================================================
-- FULL-TEXT SEARCH
-- =====================================================

-- Add search vector column to presentations
ALTER TABLE presentations ADD COLUMN search_vector tsvector;

-- Create search function
CREATE OR REPLACE FUNCTION presentations_search_update() RETURNS trigger AS $$
BEGIN
	NEW.search_vector :=
		setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
		setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
		setweight(to_tsvector('english', array_to_string(NEW.tags, ' ')), 'C');
	RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create search trigger
CREATE TRIGGER presentations_search_update
	BEFORE INSERT OR UPDATE ON presentations
	FOR EACH ROW EXECUTE FUNCTION presentations_search_update();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_slides ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
	FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
	FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
	FOR INSERT WITH CHECK (auth.uid() = id);

-- Presentations policies
CREATE POLICY "Users can view their own presentations" ON presentations
	FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own presentations" ON presentations
	FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presentations" ON presentations
	FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations" ON presentations
	FOR DELETE USING (auth.uid() = user_id);

-- Public presentations policy
CREATE POLICY "Anyone can view public presentations" ON presentations
	FOR SELECT USING (is_public = true);

-- Themes policies
CREATE POLICY "Users can view all themes" ON themes
	FOR SELECT USING (true);

CREATE POLICY "Users can insert themes" ON themes
	FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update themes" ON themes
	FOR UPDATE USING (true);

-- Slides policies
CREATE POLICY "Users can view slides of their presentations" ON slides
	FOR SELECT USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = slides.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can insert slides to their presentations" ON slides
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = slides.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can update slides of their presentations" ON slides
	FOR UPDATE USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = slides.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can delete slides of their presentations" ON slides
	FOR DELETE USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = slides.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

-- Images policies
CREATE POLICY "Users can view images of their presentations" ON presentation_images
	FOR SELECT USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = presentation_images.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can insert images to their presentations" ON presentation_images
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = presentation_images.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can update images of their presentations" ON presentation_images
	FOR UPDATE USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = presentation_images.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can delete images of their presentations" ON presentation_images
	FOR DELETE USING (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = presentation_images.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

-- Shares policies
CREATE POLICY "Users can view their own shares" ON presentation_shares
	FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create shares for their presentations" ON presentation_shares
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM presentations 
			WHERE presentations.id = presentation_shares.presentation_id 
			AND presentations.user_id = auth.uid()
		)
	);

CREATE POLICY "Users can update their own shares" ON presentation_shares
	FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own shares" ON presentation_shares
	FOR DELETE USING (auth.uid() = created_by);

-- Templates policies
CREATE POLICY "Users can view all templates" ON presentation_templates
	FOR SELECT USING (true);

CREATE POLICY "Users can insert templates" ON presentation_templates
	FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" ON presentation_templates
	FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" ON presentation_templates
	FOR DELETE USING (auth.uid() = created_by);

-- Template slides policies
CREATE POLICY "Users can view template slides" ON template_slides
	FOR SELECT USING (true);

CREATE POLICY "Users can insert template slides" ON template_slides
	FOR INSERT WITH CHECK (
		EXISTS (
			SELECT 1 FROM presentation_templates 
			WHERE presentation_templates.id = template_slides.template_id 
			AND presentation_templates.created_by = auth.uid()
		)
	);

CREATE POLICY "Users can update template slides" ON template_slides
	FOR UPDATE USING (
		EXISTS (
			SELECT 1 FROM presentation_templates 
			WHERE presentation_templates.id = template_slides.template_id 
			AND presentation_templates.created_by = auth.uid()
		)
	);

CREATE POLICY "Users can delete template slides" ON template_slides
	FOR DELETE USING (
		EXISTS (
			SELECT 1 FROM presentation_templates 
			WHERE presentation_templates.id = template_slides.template_id 
			AND presentation_templates.created_by = auth.uid()
		)
	);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
		NEW.updated_at = TIMEZONE('Asia/Kolkata', NOW());
		RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to handle user creation from auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO public.users (id, display_name, avatar_url)
	VALUES (
		NEW.id,
		COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
		NEW.raw_user_meta_data->>'avatar_url'
	);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_presentation_views()
RETURNS TRIGGER AS $$
BEGIN
	UPDATE presentations 
	SET view_count = view_count + 1 
	WHERE id = NEW.presentation_id;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================
-- TRIGGERS
-- =========================
-- Apply triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
	BEFORE UPDATE ON users 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentations_updated_at 
	BEFORE UPDATE ON presentations 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_themes_updated_at 
	BEFORE UPDATE ON themes 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at 
	BEFORE UPDATE ON slides 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentation_images_updated_at 
	BEFORE UPDATE ON presentation_images 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentation_shares_updated_at 
	BEFORE UPDATE ON presentation_shares 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_presentation_templates_updated_at 
	BEFORE UPDATE ON presentation_templates 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_slides_updated_at 
	BEFORE UPDATE ON template_slides 
	FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
	AFTER INSERT ON auth.users
	FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- STORAGE BUCKETS (Run in Supabase Dashboard)
-- =====================================================

-- Create storage buckets for images
-- Note: Run these in Supabase Dashboard > Storage > Create Bucket

/*
Storage Buckets to Create in Supabase Dashboard:

1. presentation-images
   - Public: true
   - File size limit: 10MB
   - Allowed MIME types: image/*

2. user-avatars  
   - Public: true
   - File size limit: 5MB
   - Allowed MIME types: image/*

3. template-previews
   - Public: true
   - File size limit: 5MB
   - Allowed MIME types: image/*

4. presentation-exports
   - Public: false
   - File size limit: 50MB
   - Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.presentationml.presentation

5. user-uploads
   - Public: false
   - File size limit: 20MB
   - Allowed MIME types: image/*, application/pdf

Storage Policies to Set:

-- Presentation Images Policy
CREATE POLICY "Users can upload presentation images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view presentation images" ON storage.objects
FOR SELECT USING (bucket_id = 'presentation-images');

CREATE POLICY "Users can update their presentation images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their presentation images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'presentation-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User Avatars Policy
CREATE POLICY "Users can upload their avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can update their avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Template Previews Policy
CREATE POLICY "Anyone can view template previews" ON storage.objects
FOR SELECT USING (bucket_id = 'template-previews');

CREATE POLICY "Admin can upload template previews" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'template-previews' AND
  auth.uid() IN (SELECT id FROM users WHERE subscription_tier = 'paid')
);

-- Presentation Exports Policy
CREATE POLICY "Users can upload their exports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their exports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their exports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'presentation-exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- User Uploads Policy
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their uploads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their uploads" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their uploads" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
*/

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================

-- Insert sample themes
INSERT INTO themes (background_color, text_color, font_family, font_size) VALUES
('#ffffff', '#000000', 'Arial', '16px'),
('#1e3a8a', '#ffffff', 'Roboto', '18px'),
('#f3f4f6', '#374151', 'Inter', '14px'),
('#000000', '#ffffff', 'Helvetica', '20px');

-- Insert sample templates
INSERT INTO presentation_templates (name, description, category, theme_id, is_official) VALUES
('Business Overview', 'Professional business presentation template', 'business', (SELECT id FROM themes LIMIT 1), true),
('Creative Portfolio', 'Modern creative portfolio template', 'creative', (SELECT id FROM themes LIMIT 1 OFFSET 1), true),
('Educational Content', 'Academic and educational content template', 'education', (SELECT id FROM themes LIMIT 1 OFFSET 2), true),
('Tech Innovation', 'Technology and innovation focused template', 'creative', (SELECT id FROM themes LIMIT 1 OFFSET 3), true);

-- =====================================================
-- SCHEMA COMPLETE!
-- =====================================================








