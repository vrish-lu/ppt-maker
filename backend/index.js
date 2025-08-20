import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fileManager from './src/utils/fileManager.js';

dotenv.config();

// Set production mode by default
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('🔧 Setting production mode for security');
}

// Validate required environment variables for production
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY', 
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'BRAVE_API_KEY',
  'FRONTEND_URL',
  'PORT'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const app = express();
const PORT = process.env.PORT; // Remove fallback, require environment variable

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Remove local uploads directory dependency - use cloud storage only
// app.use('/uploads', express.static('uploads'));

// Remove local uploads directory creation
// const uploadsDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// Enhanced upload function with checkpoint-based cleanup
async function uploadImageToSupabaseStorage(imageUrl, filename) {
  const checkpointId = fileManager.generateCheckpointId();
  
  try {
    console.log(`🔄 Starting upload to Supabase Storage: ${filename} (Checkpoint: ${checkpointId})`);
    
    // Download the image from Ideogram
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    // Convert arraybuffer to Buffer for Supabase upload
    const imageBuffer = Buffer.from(response.data);
    
    // Standard upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('presentation-images')
      .upload(filename, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('❌ Error uploading to Supabase Storage:', error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('presentation-images')
      .getPublicUrl(filename);
    
    console.log(`✅ Successfully uploaded to Supabase Storage: ${urlData.publicUrl}`);
    
    // Clean up any local files that might have been created
    await fileManager.cleanupAllLocalFiles(checkpointId);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ Error uploading image to Supabase Storage:', error);
    
    // Clean up any tracked files even if upload failed
    await fileManager.cleanupAllLocalFiles(checkpointId);
    
    return null;
  }
}

// Helper: Generate unique filename
function generateImageFilename(prompt, index) {
  const timestamp = Date.now();
  const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `slide_${index}_${sanitizedPrompt}_${timestamp}.jpg`;
}

// Helper: Generate outline with OpenAI
async function generateOutline(topic, numSlides, amountOfText) {
  const prompt = `Generate ${numSlides} professional slide titles for "${topic}".\n\nIMPORTANT: Use ONLY these action verbs: Revolutionizing, Transforming, Accelerating, Empowering, Disrupting, Innovating\n\nBAD examples (NEVER use):\n- "What is ${topic}"\n- "Introduction"\n- "Overview"\n- "How it works"\n- "Applications"\n\nGOOD examples for "${topic}":\n- "Revolutionizing Industry Standards"\n- "Transforming Business Models"\n- "Accelerating Innovation"\n- "Empowering Digital Transformation"\n\nReturn JSON array with ${numSlides} professional titles.`;
  console.log('Generating outline with prompt:', prompt);
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a creative presentation expert who specializes in generating compelling, action-oriented slide titles. You NEVER use generic titles and always focus on impact and innovation. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 200
    });
    const responseText = completion.choices[0]?.message?.content;
    console.log('OpenAI outline response:', responseText);
    if (!responseText) throw new Error('No response from OpenAI');
    
    // Clean the response to remove markdown code blocks
    const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error generating outline:', err);
    // Better fallback content when OpenAI fails
    return [
      `Revolutionizing ${topic} Technology`,
      `Transforming ${topic} Solutions`,
      `Accelerating ${topic} Innovation`
    ];
  }
}

// Helper: Generate slide content with OpenAI
async function generateSlideContent(slideTitle, topic, amountOfText, slideIndex = 0) {
  let prompt;
  let maxTokens;
  
  // Special handling for first slide - always one comprehensive paragraph
  if (slideIndex === 0) {
    prompt = `Generate a compelling opening paragraph for the first slide of a professional presentation.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Create a powerful hook that grabs attention\n- Use professional, engaging language with industry-specific terminology\n- Include specific insights, statistics, or compelling facts\n- Make it memorable and thought-provoking\n- Use storytelling elements or surprising statistics\n- Return a JSON object: { paragraphs: string[] (1 comprehensive paragraph, 40-60 words) }`;
    maxTokens = 250;
  } else if (slideIndex === 2) {
    // Special handling for third slide - always generate bullets
    if (amountOfText === 'Extensive') {
      prompt = `Generate professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks, specific examples, and actionable insights\n- Include relevant statistics, case studies, or industry trends\n- Make content engaging and memorable\n- Return a JSON object: { bullets: string[] (4-6 professional bullet points, 8-15 words each) }`;
      maxTokens = 200;
    } else if (amountOfText === 'Detailed') {
      prompt = `Generate detailed professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Include compelling hooks and specific insights\n- Use professional language with concrete examples and industry terminology\n- Make content engaging and actionable with specific benefits\n- Include relevant statistics, case studies, or industry trends\n- Return a JSON object: { bullets: string[] (3-5 professional bullet points, 6-12 words each) }`;
      maxTokens = 180;
    } else if (amountOfText === 'Concise') {
      prompt = `Generate concise professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use engaging hooks and specific insights\n- Keep content clear and impactful with professional terminology\n- Include specific benefits or outcomes\n- Return a JSON object: { bullets: string[] (3-4 professional bullet points, 5-10 words each) }`;
      maxTokens = 150;
    } else {
      // Minimal
      prompt = `Generate minimal professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { bullets: string[] (2-3 professional bullet points, 5-8 words each) }`;
      maxTokens = 120;
    }
  } else {
    // For other slides, generate professional paragraphs instead of bullets
    if (amountOfText === 'Extensive') {
      prompt = `Generate professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks, specific examples, and actionable insights\n- Include relevant statistics, case studies, or industry trends\n- Make content engaging and memorable\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-30 words each) }`;
      maxTokens = 200;
    } else if (amountOfText === 'Detailed') {
      prompt = `Generate detailed professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Include compelling hooks and specific insights\n- Use professional language with concrete examples and industry terminology\n- Make content engaging and actionable with specific benefits\n- Include relevant statistics, case studies, or industry trends\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 15-25 words each) }`;
      maxTokens = 180;
    } else if (amountOfText === 'Concise') {
      prompt = `Generate concise professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use engaging hooks and specific insights\n- Keep content clear and impactful with professional terminology\n- Include specific benefits or outcomes\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-35 words each) }`;
      maxTokens = 200;
    } else {
      // Minimal
      prompt = `Generate minimal professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-35 words each) }`;
      maxTokens = 200;
    }
  }
  
  console.log('Generating slide content with prompt:', prompt);
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a professional presentation expert specializing in creating compelling, engaging content with powerful hooks and actionable insights. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: maxTokens
    });
    const responseText = completion.choices[0]?.message?.content;
    console.log('OpenAI slide content response:', responseText);
    if (!responseText) throw new Error('No response from OpenAI');
    
    // Clean the response to remove markdown code blocks
    const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    
    // Handle different response formats based on slide index
    let bullets;
    if (slideIndex === 2) {
      // For third slide, use bullets directly
      bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
    } else {
      // For other slides, convert paragraphs to bullets for compatibility with existing frontend
      const paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [];
      bullets = paragraphs.map(paragraph => paragraph.trim());
    }
    
    // Adjust the number of paragraphs/bullets based on amount of text
    let maxParagraphs;
    if (slideIndex === 0) {
      maxParagraphs = 1; // Always one paragraph for slide one
    } else if (slideIndex === 2) {
      // For third slide, adjust number of bullets
      if (amountOfText === 'Extensive') {
        maxParagraphs = 6;
      } else if (amountOfText === 'Detailed') {
        maxParagraphs = 5;
      } else if (amountOfText === 'Concise') {
        maxParagraphs = 4;
      } else {
        maxParagraphs = 3;
      }
    } else if (amountOfText === 'Extensive') {
      maxParagraphs = 2; // Reduced from 3 to 2
    } else if (amountOfText === 'Detailed') {
      maxParagraphs = 2;
    } else if (amountOfText === 'Concise') {
      maxParagraphs = 1;
    } else {
      maxParagraphs = 2;
    }
    
    return {
      bullets: bullets.slice(0, maxParagraphs)
    };
  } catch (err) {
    console.error('Error generating slide content:', err);
    return {
      bullets: slideIndex === 0 ? [`Professional introduction to ${topic}`] : [`Key insights about ${slideTitle}`, `Important benefits of ${slideTitle}`]
    };
  }
}

// Helper: Search for image with Brave Search API
async function searchBraveImage(prompt, style, slideIndex = 0) {
  try {
    console.log(`Searching for image: ${prompt} with style: ${style}`);
    
    // Check if API key is available
    if (!process.env.BRAVE_API_KEY) {
      throw new Error('BRAVE_API_KEY environment variable is not set');
    }
    
    const searchQuery = `${prompt} ${style}`.trim();
    const params = {
      q: searchQuery,
      count: 5 // Number of results to return
    };

    console.log('Searching Brave for images with query:', searchQuery);
    
    const response = await axios.get(`https://api.search.brave.com/res/v1/images/search?${new URLSearchParams(params)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      },
      timeout: 30000
    });

    // Handle the response structure from Brave Search API
    const results = response.data?.results || [];
    console.log(`Brave Search API successful, found ${results.length} results`);
    
    if (results.length > 0) {
      // Select a random image from the results for variety
      const randomIndex = Math.floor(Math.random() * Math.min(results.length, 3));
      const selectedResult = results[randomIndex];
      const imageUrl = selectedResult.properties?.url || selectedResult.image?.url || selectedResult.url;
      
      if (!imageUrl) {
        console.error('No image URL found in results:', selectedResult);
        throw new Error('No image URL found in Brave Search results');
      }
      
      console.log('Brave Search API successful, uploading to Supabase Storage...');
      
      const filename = `slide-${slideIndex}-${Date.now()}.jpg`;
      console.log('📁 Generated filename:', filename);
      
      // Download the image for Supabase Storage upload
      console.log('📥 Downloading image from:', imageUrl);
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      console.log('✅ Image downloaded, size:', imageResponse.data.byteLength, 'bytes');
      
      // Upload directly to Supabase Storage (no local saving)
      console.log('☁️ Uploading to Supabase Storage bucket: presentation-images');
      const { data, error } = await supabase.storage
        .from('presentation-images')
        .upload(filename, imageResponse.data, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        console.error('❌ Error uploading to Supabase Storage:', error);
        console.error('Error details:', error);
        throw error;
      }
      
      console.log('✅ Supabase upload successful, data:', data);
      
      // Get the public URL
      console.log('🔗 Getting public URL for uploaded file...');
      const { data: urlData } = supabase.storage
        .from('presentation-images')
        .getPublicUrl(filename);
      
      console.log(`✅ Successfully uploaded to Supabase Storage: ${urlData.publicUrl}`);
      return urlData.publicUrl;
      
    } else {
      throw new Error('No results found in Brave Search API response');
    }
    
  } catch (error) {
    console.error('Error searching for image:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // Retry with a simpler query if the first attempt fails
    if (prompt.length > 20) {
      console.log('🔄 Retrying with simplified query...');
      const simplifiedPrompt = prompt.split(' ').slice(0, 3).join(' ');
      return await searchBraveImage(simplifiedPrompt, style, slideIndex);
    }
    
    return null;
  }
}

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { title, outline, theme, amountOfText, slideCount, imageSource, imageStyle } = req.body;
  try {
    // If outline is empty or not provided, generate it with GPT
    const numSlides = outline && outline.length ? outline.length : (slideCount || 5);
    const outlineTitles = outline && outline.length && outline[0].title
      ? outline.map(s => s.title)
      : await generateOutline(title, numSlides, amountOfText);

    // Generate paragraphs for each slide
    const slides = await Promise.all(outlineTitles.map(async (slideTitle, idx) => {
      const content = await generateSlideContent(slideTitle, title, amountOfText, idx);
      let imageUrl;
      // Always generate images using Brave Search, regardless of imageSource setting
      console.log(`🖼️ Generating image for slide ${idx + 1}: ${slideTitle}`);
      try {
        // Add timeout for image generation (increased to 45 seconds for download + upload)
        const imagePromise = searchBraveImage(slideTitle + ' ' + (imageStyle || ''), imageStyle, idx);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image generation timeout')), 45000)
        );
        imageUrl = await Promise.race([imagePromise, timeoutPromise]);
        console.log(`🖼️ Slide ${idx + 1} image result:`, imageUrl ? 'SUCCESS' : 'FAILED');
      } catch (imageError) {
        console.error(`🖼️ Image generation failed for slide ${idx + 1}:`, imageError.message);
        imageUrl = null; // Continue without image
      }
      
      // Determine layout: first slide always left image, others random
      let layout;
      if (idx === 0) {
        layout = 'image-left'; // First slide always left image
        console.log(`Slide ${idx + 1}: First slide - layout set to ${layout}`);
      } else {
        // Randomly select from: image-left, image-right (only allowed database values)
        const layoutOptions = ['image-left', 'image-right'];
        const randomIndex = Math.floor(Math.random() * layoutOptions.length);
        layout = layoutOptions[randomIndex];
        console.log(`Slide ${idx + 1}: Random layout selected - ${layout} (index: ${randomIndex})`);
      }
      
      return {
        id: `slide-${idx + 1}`,
        title: slideTitle,
        bullets: content.bullets,
        layout: layout,
        theme,
        image: imageUrl ? {
          url: imageUrl,
          alt: slideTitle,
          source: imageSource,
          style: imageStyle
        } : undefined
      };
    }));
    
    // Log the layouts for debugging
    console.log('Generated slides with layouts:');
    slides.forEach((slide, index) => {
      console.log(`Slide ${index + 1}: ${slide.title} - Layout: ${slide.layout} - Has Image: ${slide.image ? 'YES' : 'NO'}`);
      if (slide.image) {
        console.log(`  Image URL: ${slide.image.url}`);
      }
    });
    
    res.json({
      slides,
      meta: {
        title,
        theme,
        amountOfText,
        imageSource,
        imageStyle
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate slides', details: err.message });
  }
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Use Supabase Auth for login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      
      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        return res.status(400).json({
          error: 'Email not confirmed',
          message: 'Please check your email and click the confirmation link before logging in'
        });
      } else if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      } else {
        return res.status(400).json({
          error: 'Login failed',
          message: error.message
        });
      }
    }

    // Get user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userProfile?.display_name || data.user.email?.split('@')[0] || 'User',
        display_name: userProfile?.display_name || data.user.email?.split('@')[0] || 'User',
        created_at: data.user.created_at
      },
      token: data.session.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error.message || 'Internal server error'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, and name are required'
      });
    }

    // Use Supabase Auth for registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name
        },
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      return res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      // Email confirmation is required
      return res.status(201).json({
        message: 'Registration successful! Please check your email and click the confirmation link before logging in.',
        user: {
          id: data.user.id,
          email: data.user.email,
          name: name,
          display_name: name,
          created_at: data.user.created_at
        },
        requiresEmailConfirmation: true
      });
    }

    // User profile will be created automatically by the database trigger
    // when a new user is created in auth.users

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: name,
        display_name: name,
        created_at: data.user.created_at
      },
      token: data.session?.access_token,
      requiresEmailConfirmation: false
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message || 'Internal server error'
    });
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Get user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: userProfile?.display_name || user.email?.split('@')[0] || 'User',
        bio: userProfile?.bio || null,
        company: userProfile?.company || null,
        role: userProfile?.role || null,
        created_at: user.created_at,
        updated_at: userProfile?.updated_at || user.created_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  try {
    const { name, email, bio, company, role } = req.body;
    
    if (!name && !email && !bio && !company && !role) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'At least one field is required'
      });
    }

    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Update user profile in users table
    const updateData = {};
    if (name) updateData.display_name = name;
    if (bio) updateData.bio = bio;
    if (company) updateData.company = company;
    if (role) updateData.role = role;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return res.status(500).json({
        error: 'Failed to update profile',
        message: 'Database error'
      });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: updatedProfile.display_name || user.email?.split('@')[0] || 'User',
        bio: updatedProfile.bio || null,
        company: updatedProfile.company || null,
        role: updatedProfile.role || null,
        created_at: user.created_at,
        updated_at: updatedProfile.updated_at
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
});

// Presentations endpoints
app.get('/api/presentations', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    } else {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase (using anon client for user auth)
      const { data: { user: authUser }, error } = await supabaseAnon.auth.getUser(token);
      
      if (error || !authUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      } else {
        user = authUser;
      }
    }

    // Get presentations with their slides from the slides table
    console.log('🔍 Fetching presentations for user:', user.id);
    
    let presentations = [];
    let presentationsError = null;
    
    try {
      const result = await supabase
        .from('presentations')
        .select(`
          *,
          slides (
            id,
            title,
            content,
            layout,
            slide_order
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      presentations = result.data || [];
      presentationsError = result.error;
      
      console.log('📊 Found presentations:', presentations.length);
    } catch (dbError) {
      console.error('❌ Database query error:', dbError);
      presentationsError = dbError;
    }

    // Process slides data for each presentation
    if (presentations) {
      presentations.forEach(presentation => {
        try {
          // Convert slides table data to the format expected by frontend
          if (presentation.slides && Array.isArray(presentation.slides)) {
            presentation.slides = presentation.slides.map(slide => {
              // Parse the content JSONB field properly
              let parsedContent = {};
              let bullets = [];
              
              try {
                if (slide.content && typeof slide.content === 'string') {
                  parsedContent = JSON.parse(slide.content);
                } else if (slide.content && typeof slide.content === 'object') {
                  parsedContent = slide.content;
                }
                
                // Extract bullets from the parsed content
                bullets = parsedContent.bullets || [];
                
                console.log(`🔍 Slide ${slide.title}: parsed content:`, parsedContent, 'bullets:', bullets);
              } catch (e) {
                console.warn('Failed to parse slide content for slide:', slide.id, e);
                bullets = [];
              }
              
              return {
                id: slide.id,
                title: slide.title,
                bullets: bullets,
                content: parsedContent, // Keep the full content structure
                layout: slide.layout || 'image-left',
                order: slide.slide_order
              };
            });
          } else {
            presentation.slides = [];
          }
        } catch (e) {
          console.warn('Failed to process slides data for presentation:', presentation.id, e);
          presentation.slides = [];
        }
      });
    }

    if (presentationsError) {
      console.error('Error fetching presentations:', presentationsError);
      return res.status(500).json({
        error: 'Failed to fetch presentations',
        message: 'Database error'
      });
    }

    res.json({
      presentations: presentations || [],
      count: presentations?.length || 0
    });
  } catch (error) {
    console.error('Get presentations error:', error);
    res.status(500).json({
      error: 'Failed to get presentations',
      message: 'Internal server error'
    });
  }
});

// Create a new presentation using the updated Presentation model
app.post('/api/presentations', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    } else {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase (using anon client for user auth)
      const { data: { user: authUser }, error } = await supabaseAnon.auth.getUser(token);
      
      if (error || !authUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      } else {
        user = authUser;
      }
    }
    
    console.log('🔍 Creating presentation with data:', req.body);
    
    user = authUser;

    const { title, description, themeId, amountOfText, imageSource, imageStyle, slideCount, slides, metadata } = req.body;
    
    if (!title) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Title is required'
      });
    }

    // Use the updated Presentation model that handles typingBullets extraction
    const { Presentation } = await import('./src/models/Presentation.js');
    
    try {
      const presentation = await Presentation.create({
        userId: user.id,
        title,
        description,
        themeId,
        amountOfText,
        imageSource,
        imageStyle,
        slideCount,
        slides,
        metadata
      });
      
      console.log('✅ Presentation created successfully using updated model:', presentation.id);
      
      res.status(201).json({
        message: 'Presentation created successfully',
        presentation: presentation
      });
      
    } catch (modelError) {
      console.error('❌ Error in Presentation.create:', modelError);
      return res.status(500).json({
        error: 'Failed to create presentation',
        message: 'Model error',
        details: modelError.message
      });
    }
  } catch (error) {
    console.error('Create presentation error:', error);
    res.status(500).json({
      error: 'Failed to create presentation',
      message: 'Internal server error'
    });
  }
});

// Update an existing presentation
app.put('/api/presentations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, theme, slides, metadata } = req.body;
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    } else {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase (using anon client for user auth)
      const { data: { user: authUser }, error } = await supabaseAnon.auth.getUser(token);
      
      if (error || !authUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      } else {
        user = authUser;
      }
    }

    // Check if presentation exists and belongs to user
    const { data: existingPresentation, error: fetchError } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPresentation) {
      return res.status(404).json({
        error: 'Presentation not found',
        message: 'Presentation does not exist or does not belong to user'
      });
    }

    // Use the updated Presentation model that handles typingBullets extraction
    const { Presentation } = await import('./src/models/Presentation.js');
    
    try {
      const updatedPresentation = await Presentation.update(id, user.id, {
        title: title || existingPresentation.title,
        description: description || existingPresentation.description,
        themeId: themeId || existingPresentation.theme_id,
        amountOfText: amountOfText || existingPresentation.amount_of_text,
        imageSource: imageSource || existingPresentation.image_source,
        imageStyle: imageStyle || existingPresentation.image_style,
        slideCount: slideCount || existingPresentation.slide_count,
        slides,
        metadata
      });
      
      console.log('✅ Presentation updated successfully using updated model:', updatedPresentation.id);
      
      res.status(200).json({
        message: 'Presentation updated successfully',
        presentation: updatedPresentation
      });
      
    } catch (modelError) {
      console.error('❌ Error in Presentation.update:', modelError);
      return res.status(500).json({
        error: 'Failed to update presentation',
        message: 'Model error',
        details: modelError.message
      });
    }

    res.status(200).json({
      message: 'Presentation updated successfully',
      presentation: updatedPresentation
    });
  } catch (error) {
    console.error('Update presentation error:', error);
    res.status(500).json({
      error: 'Failed to update presentation',
      message: 'Internal server error'
    });
  }
});

// Email confirmation endpoint
app.post('/api/auth/confirm-email', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    if (!email || !token) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and confirmation token are required'
      });
    }

    // Verify the email confirmation token with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (error) {
      console.error('Email confirmation error:', error);
      return res.status(400).json({
        error: 'Email confirmation failed',
        message: error.message
      });
    }

    res.json({
      message: 'Email confirmed successfully',
      user: data.user
    });
  } catch (error) {
    console.error('Confirm email error:', error);
    res.status(500).json({
      error: 'Failed to confirm email',
      message: error.message || 'Internal server error'
    });
  }
});

// Resend confirmation email endpoint
app.post('/api/auth/resend-confirmation', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Email is required'
      });
    }

    // Resend confirmation email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      return res.status(400).json({
        error: 'Failed to resend confirmation',
        message: error.message
      });
    }

    res.json({
      message: 'Confirmation email sent successfully'
    });
  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({
      error: 'Failed to resend confirmation',
      message: error.message || 'Internal server error'
    });
  }
});

// Upload user image to Supabase Storage
app.post('/api/upload-image', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    let user = null;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    } else {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase (using anon client for user auth)
      const { data: { user: authUser }, error } = await supabaseAnon.auth.getUser(token);
      
      if (error || !authUser) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
      } else {
        user = authUser;
      }
    }

    // Check if image data is provided
    const { imageData, filename, slideIndex } = req.body;
    
    if (!imageData || !filename || slideIndex === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Image data, filename, and slide index are required'
      });
    }

    // Remove data URL prefix to get base64 data
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename with user ID and timestamp
    const uniqueFilename = `user-upload-${user.id}-${Date.now()}-${filename}`;

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('presentation-images')
      .upload(uniqueFilename, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return res.status(500).json({
        error: 'Failed to upload image',
        message: 'Storage upload failed'
      });
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('presentation-images')
      .getPublicUrl(uniqueFilename);

    console.log(`✅ User image uploaded to Supabase Storage: ${urlData.publicUrl}`);

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: urlData.publicUrl,
      filename: uniqueFilename
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: 'Internal server error'
    });
  }
});

// Get a specific presentation with its slides
app.get('/api/presentations/:id', async (req, res) => {
  try {
    console.log('🔍 GET /api/presentations/:id called with ID:', req.params.id);
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extracted, verifying with Supabase...');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Token verification failed:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    console.log('✅ Token verified for user:', user.id);
    const { id } = req.params;
    console.log('📋 Fetching presentation with ID:', id);
    
    // Get presentation with slides
    const { data: presentation, error: presentationError } = await supabase
      .from('presentations')
      .select(`
        *,
        slides (
          id,
          title,
          content,
          layout,
          slide_order
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (presentationError) {
      console.error('❌ Error fetching presentation:', presentationError);
      return res.status(404).json({ 
        error: 'Presentation not found',
        message: 'The requested presentation does not exist'
      });
    }

    console.log('✅ Presentation found:', presentation.title);
    console.log('📝 Slides count:', presentation.slides?.length || 0);

    // Sort slides by slide_order
    if (presentation.slides) {
      presentation.slides.sort((a, b) => a.slide_order - b.slide_order);
    }

    res.json({
      presentation
    });
  } catch (error) {
    console.error('❌ Get presentation error:', error);
    res.status(500).json({
      error: 'Failed to get presentation',
      message: 'Internal server error'
    });
  }
});

// DELETE /api/presentations/:id - Delete a specific presentation
app.delete('/api/presentations/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /api/presentations/:id called with ID:', req.params.id);
    
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extracted, verifying with Supabase...');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Token verification failed:', error);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    console.log('✅ Token verified for user:', user.id);
    const { id } = req.params;
    console.log('📋 Deleting presentation with ID:', id);
    
    // First, get the presentation to verify ownership
    const { data: presentation, error: presentationError } = await supabase
      .from('presentations')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (presentationError) {
      console.error('❌ Error fetching presentation for deletion:', presentationError);
      return res.status(500).json({ error: 'Failed to fetch presentation' });
    }
    
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    
    // Delete slides first (due to foreign key constraints)
    const { error: slidesDeleteError } = await supabase
      .from('slides')
      .delete()
      .eq('presentation_id', id);
    
    if (slidesDeleteError) {
      console.error('❌ Error deleting slides:', slidesDeleteError);
      return res.status(500).json({ error: 'Failed to delete slides' });
    }
    
    // Delete the presentation
    const { error: presentationDeleteError } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (presentationDeleteError) {
      console.error('❌ Error deleting presentation:', presentationDeleteError);
      return res.status(500).json({ error: 'Failed to delete presentation' });
    }
    
    console.log('✅ Successfully deleted presentation:', id);
    res.json({ message: 'Presentation deleted successfully' });
    
  } catch (error) {
    console.error('❌ Delete presentation error:', error);
    res.status(500).json({
      error: 'Failed to delete presentation',
      message: 'Internal server error'
    });
  }
});

// Delete all user data endpoint
app.delete('/api/auth/delete-all-data', async (req, res) => {
  try {
    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    console.log('🗑️ Deleting all data for user:', user.id);

    // Delete all presentations and related data for the user
    const { data: presentations, error: presentationsError } = await supabase
      .from('presentations')
      .select('id')
      .eq('user_id', user.id);

    if (presentationsError) {
      console.error('Error fetching presentations:', presentationsError);
      return res.status(500).json({
        error: 'Failed to fetch presentations',
        message: 'Database error'
      });
    }

    if (presentations && presentations.length > 0) {
      const presentationIds = presentations.map(p => p.id);
      
      // Delete slides for all presentations
      const { error: slidesError } = await supabase
        .from('slides')
        .delete()
        .in('presentation_id', presentationIds);

      if (slidesError) {
        console.error('Error deleting slides:', slidesError);
      } else {
        console.log('✅ Deleted slides for', presentations.length, 'presentations');
      }

      // Delete presentation images
      const { error: imagesError } = await supabase
        .from('presentation_images')
        .delete()
        .in('presentation_id', presentationIds);

      if (imagesError) {
        console.error('Error deleting presentation images:', imagesError);
      } else {
        console.log('✅ Deleted presentation images');
      }

      // Delete presentations
      const { error: deletePresentationsError } = await supabase
        .from('presentations')
        .delete()
        .eq('user_id', user.id);

      if (deletePresentationsError) {
        console.error('Error deleting presentations:', deletePresentationsError);
        return res.status(500).json({
          error: 'Failed to delete presentations',
          message: 'Database error'
        });
      } else {
        console.log('✅ Deleted', presentations.length, 'presentations');
      }
    }

    // Delete user profile
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteUserError) {
      console.error('Error deleting user profile:', deleteUserError);
    } else {
      console.log('✅ Deleted user profile');
    }

    // Delete user from auth (this will also delete the user profile due to cascade)
    const { error: deleteAuthUserError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteAuthUserError) {
      console.error('Error deleting auth user:', deleteAuthUserError);
      // Don't fail the request if auth deletion fails
    } else {
      console.log('✅ Deleted auth user');
    }

    res.json({
      message: 'All user data deleted successfully',
      deletedPresentations: presentations?.length || 0
    });
  } catch (error) {
    console.error('Delete all data error:', error);
    res.status(500).json({
      error: 'Failed to delete all data',
      message: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health',
      'GET /api/presentations',
      'GET /api/presentations/:id',
      'POST /api/presentations',
      'POST /api/generate',
      'POST /api/generate-image',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'DELETE /api/auth/delete-all-data',
      'GET /api/file-manager/stats',
      'POST /api/file-manager/cleanup',
      'GET /api/file-manager/checkpoint',
      'POST /api/file-manager/reset',
      'GET /api/file-manager/validate'
    ]
  });
});

// =====================================================
// CHECKPOINT-BASED FILE MANAGEMENT ENDPOINTS
// =====================================================

// Get storage statistics
app.get('/api/file-manager/stats', async (req, res) => {
  try {
    const stats = await fileManager.getStorageStats();
    await fileManager.logStorageStats();
    res.json(stats);
  } catch (error) {
    console.error('Storage stats error:', error);
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

// Manual cleanup endpoint
app.post('/api/file-manager/cleanup', async (req, res) => {
  try {
    const { checkpointId, hoursOld } = req.body;
    
    // Clean up tracked files
    const trackedResult = await fileManager.cleanupAllLocalFiles(checkpointId);
    
    // Clean up old files (optional)
    let oldFilesResult = null;
    if (hoursOld) {
      oldFilesResult = await fileManager.cleanupOldFiles(hoursOld, checkpointId);
    }
    
    res.json({
      message: 'File cleanup completed',
      trackedFiles: trackedResult,
      oldFiles: oldFilesResult,
      checkpointId: checkpointId || fileManager.generateCheckpointId()
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// Get checkpoint information
app.get('/api/file-manager/checkpoint', (req, res) => {
  try {
    const checkpoint = fileManager.getCheckpointInfo();
    res.json({
      checkpoint,
      currentTracking: Array.from(fileManager.localFilesToCleanup)
    });
  } catch (error) {
    console.error('Checkpoint info error:', error);
    res.status(500).json({ error: 'Failed to get checkpoint info' });
  }
});

// Reset checkpoint
app.post('/api/file-manager/reset', (req, res) => {
  try {
    fileManager.resetCheckpoint();
    res.json({
      message: 'Checkpoint reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Reset checkpoint error:', error);
    res.status(500).json({ error: 'Failed to reset checkpoint' });
  }
});

// Validate checkpoint integrity
app.get('/api/file-manager/validate', async (req, res) => {
  try {
    const validation = await fileManager.validateCheckpoint();
    res.json(validation);
  } catch (error) {
    console.error('Checkpoint validation error:', error);
    res.status(500).json({ error: 'Failed to validate checkpoint' });
  }
});

// Scheduled cleanup (runs every hour)
setInterval(async () => {
  console.log('🕐 Running scheduled file cleanup...');
  try {
    const checkpointId = fileManager.generateCheckpointId();
    await fileManager.cleanupAllLocalFiles(checkpointId);
    await fileManager.cleanupOldFiles(24, checkpointId); // Clean files older than 24 hours
    await fileManager.logStorageStats();
  } catch (error) {
    console.error('❌ Scheduled cleanup error:', error);
  }
}, 60 * 60 * 1000); // 1 hour

const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: http://${HOST}:${PORT}/api/auth`);
  console.log(`📝 Presentation endpoints: http://${HOST}:${PORT}/api/presentations`);
  console.log(`🗂️ File manager endpoints: http://${HOST}:${PORT}/api/file-manager/*`);
});

// POST /api/generate-image (deprecated - using direct Brave Search URLs now)
app.post('/api/generate-image', async (req, res) => {
  res.status(410).json({ error: 'This endpoint is deprecated. Images are now generated directly with slides.' });
});

// POST /api/regenerate-image - Regenerate image for a specific slide using Brave Search
app.post('/api/regenerate-image', async (req, res) => {
  const { prompt, style, slideIndex } = req.body;
  
  try {
    console.log(`🖼️ Regenerating image for slide ${slideIndex + 1} with prompt: ${prompt}`);
    
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Generate image using Brave Search
    const imageUrl = await searchBraveImage(prompt, style || '', slideIndex);
    
    if (imageUrl) {
      console.log(`✅ Image regenerated successfully for slide ${slideIndex + 1}: ${imageUrl}`);
      res.json({ 
        imageUrl,
        success: true,
        message: 'Image regenerated successfully'
      });
    } else {
      console.log(`❌ Failed to regenerate image for slide ${slideIndex + 1}`);
      res.status(500).json({ 
        error: 'Failed to generate image',
        success: false
      });
    }
  } catch (error) {
    console.error('❌ Error regenerating image:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false
    });
  }
});
