import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a simple placeholder image (1x1 pixel transparent PNG)
function createPlaceholderImage() {
  // Base64 encoded 1x1 transparent PNG
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return Buffer.from(base64Image, 'base64');
}

async function uploadPlaceholderImages() {
  try {
    console.log('Uploading placeholder images to Supabase Storage...');
    
    // Upload placeholder images for slides 0-4
    for (let i = 0; i < 5; i++) {
      const filename = `placeholder-${i}.jpg`;
      const imageBuffer = createPlaceholderImage();
      
      console.log(`Uploading ${filename}...`);
      
      const { data, error } = await supabase.storage
        .from('presentation-images')
        .upload(filename, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading ${filename}:`, error);
      } else {
        console.log(`✅ Successfully uploaded ${filename}`);
      }
    }
    
    console.log('Placeholder image upload complete!');
  } catch (error) {
    console.error('Error uploading placeholder images:', error);
  }
}

uploadPlaceholderImages(); 