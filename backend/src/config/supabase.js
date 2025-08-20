import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('✅ Supabase environment variables found, connecting to real database...');
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Service Role Key:', supabaseServiceKey ? 'SET' : 'MISSING');

// Create Supabase client with service role key (for backend operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key (for auth operations)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Table names
export const TABLES = {
  USERS: 'users',
  PRESENTATIONS: 'presentations',
  SLIDES: 'slides',
  THEMES: 'themes',
  PRESENTATION_IMAGES: 'presentation_images',
  PRESENTATION_SHARES: 'presentation_shares',
  PRESENTATION_TEMPLATES: 'presentation_templates',
  TEMPLATE_SLIDES: 'template_slides'
};

// Note: TypeScript types are available in database.types.ts
// For JavaScript usage, import the types directly where needed 