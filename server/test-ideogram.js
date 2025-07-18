import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

async function testIdeogram() {
  try {
    console.log('Testing Ideogram API...');
    console.log('API Key configured:', !!process.env.IDEOGRAM_API_KEY);
    
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.IDEOGRAM_API_KEY
      },
      body: JSON.stringify({
        prompt: 'Professional business presentation slide illustration for AI in healthcare',
        rendering_speed: 'TURBO',
        aspect_ratio: '16x9',
        quality: 'standard'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testIdeogram(); 