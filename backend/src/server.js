import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import fs from 'fs';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Import routes
import authRoutes from './routes/auth.js';
import presentationRoutes from './routes/presentations.js';

console.log('🔍 Routes imported:', {
  authRoutes: !!authRoutes,
  presentationRoutes: !!presentationRoutes,
  presentationRoutesKeys: presentationRoutes ? Object.keys(presentationRoutes) : 'NO_ROUTES'
});

// Import Supabase config
import { supabase } from './config/supabase.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

// Security middleware
app.use(helmet());

// CORS configuration - allow connections from any device on the network
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    // Allow connections from any IP on the network
    /^http:\/\/192\.168\.\d+\.\d+:5173$/,
    /^http:\/\/192\.168\.\d+\.\d+:5174$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
    /^http:\/\/10\.\d+\.\d+\.\d+:5174$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5174$/,
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper: Search for image with Brave Search API
async function searchBraveImage(prompt, style, slideIndex = 0) {
  try {
    console.log(`Searching for image: ${prompt} with style: ${style}`);
    
    // Check if API key is available
    if (!process.env.BRAVE_API_KEY) {
      throw new Error('BRAVE_API_KEY environment variable is not set');
    }
    
    console.log('Using Brave API key:', process.env.BRAVE_API_KEY.substring(0, 10) + '...');
    console.log('Full API key length:', process.env.BRAVE_API_KEY.length);
    
    const searchQuery = `${prompt} ${style}`.trim();
    const params = {
      q: searchQuery,
      count: 5 // Number of results to return
    };

    console.log('Searching Brave for images with query:', searchQuery);
    console.log('Request params:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(`https://api.search.brave.com/res/v1/images/search?${new URLSearchParams(params)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': process.env.BRAVE_API_KEY || 'BSAMAEXs_5wDr5143rU0RgUgH537arA'
      },
      timeout: 30000
    });

    console.log('Brave Search API response status:', response.status);
    console.log('Brave Search API response data:', response.data);
    
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
      
      // Download the image and save it locally for PowerPoint export
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      // Save to local uploads directory
      const localPath = path.join(__dirname, '../uploads', filename);
      fs.writeFileSync(localPath, imageResponse.data);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('presentation-images')
        .upload(filename, imageResponse.data, {
          contentType: 'image/jpeg',
          upsert: true
        });
      
      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
      }
      
      // Get the public URL
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
    if (error.response?.status === 401) {
      throw new Error('Invalid or expired Brave API key. Please check your BRAVE_API_KEY environment variable.');
    }
    throw error; // Don't use fallbacks, throw the error
  }
}

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
try {
  console.log('🔍 Registering auth routes...');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes registered');
  
  console.log('🔍 Registering presentation routes...');
  app.use('/api/presentations', presentationRoutes);
  console.log('✅ Presentations routes registered at /api/presentations');
} catch (error) {
  console.error('❌ Error registering routes:', error);
}

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

// Test the route registration by adding a simple route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Health check working',
    routes: {
      test: '/api/test',
      health: '/api/health'
    }
  });
});



// Legacy slide generation endpoint (for backward compatibility)
app.post('/api/generate', async (req, res) => {
  try {
    const { title, outline, theme, amountOfText, slideCount, imageSource, imageStyle } = req.body;
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Helper: Generate outline with OpenAI
    async function generateOutline(topic, numSlides, amountOfText) {
      const prompt = `Generate ${numSlides} professional slide titles for "${topic}".\n\nIMPORTANT: Use ONLY these action verbs: Revolutionizing, Transforming, Accelerating, Empowering, Disrupting, Innovating\n\nBAD examples (NEVER use):\n- "What is ${topic}"\n- "Introduction"\n- "Overview"\n- "How it works"\n- "Applications"\n\nGOOD examples for "${topic}":\n- "Revolutionizing Industry Standards"\n- "Transforming Business Models"\n- "Accelerating Innovation"\n- "Empowering Digital Transformation"\n\nReturn JSON array with ${numSlides} professional titles.`;
      
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
        if (!responseText) throw new Error('No response from OpenAI');
        
        const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.error('Error generating outline:', err);
        return [
          `Introduction to ${topic}`,
          `Key Concepts of ${topic}`,
          `Applications of ${topic}`
        ];
      }
    }

    // Helper: Generate slide content with OpenAI
    async function generateSlideContent(slideTitle, topic, amountOfText, slideIndex = 0) {
      let prompt;
      let maxTokens;
      
      if (slideIndex === 0) {
        prompt = `Generate a compelling opening paragraph for the first slide of a professional presentation.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Create a powerful hook that grabs attention\n- Use professional, engaging language with industry-specific terminology\n- Include specific insights, statistics, or compelling facts\n- Make it memorable and thought-provoking\n- Use storytelling elements or surprising statistics\n- Return a JSON object: { paragraphs: string[] (1 comprehensive paragraph, 40-60 words) }`;
        maxTokens = 250;
      } else if (slideIndex === 2) {
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
          prompt = `Generate minimal professional bullet points for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { bullets: string[] (2-3 professional bullet points, 5-8 words each) }`;
          maxTokens = 120;
        }
      } else {
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
          prompt = `Generate minimal professional paragraphs for a presentation slide.\n- Slide title: "${slideTitle}"\n- Topic: "${topic}"\n- Amount of text: ${amountOfText}\n- Use compelling hooks and specific insights\n- Keep content clear and engaging with professional language\n- Include specific benefits or key takeaways\n- Return a JSON object: { paragraphs: string[] (1-2 professional paragraphs, 20-35 words each) }`;
          maxTokens = 200;
        }
      }
      
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
        if (!responseText) throw new Error('No response from OpenAI');
        
        const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(cleanedResponse);
        
        let bullets;
        if (slideIndex === 2) {
          bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
        } else {
          const paragraphs = Array.isArray(parsed.paragraphs) ? parsed.paragraphs : [];
          bullets = paragraphs.map(paragraph => paragraph.trim());
        }
        
        let maxParagraphs;
        if (slideIndex === 0) {
          maxParagraphs = 1;
        } else if (slideIndex === 2) {
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
          maxParagraphs = 2;
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
          bullets: slideIndex === 0 ? ['Sample professional opening paragraph for slide one.'] : ['Sample professional paragraph 1', 'Sample professional paragraph 2']
        };
      }
    }

    // If outline is empty or not provided, generate it with GPT
    const numSlides = outline && outline.length ? outline.length : (slideCount || 5);
    const outlineTitles = outline && outline.length && outline[0].title
      ? outline.map(s => s.title)
      : await generateOutline(title, numSlides, amountOfText);

    // Generate paragraphs for each slide
    const slides = await Promise.all(outlineTitles.map(async (slideTitle, idx) => {
      const content = await generateSlideContent(slideTitle, title, amountOfText, idx);
      
      // Generate image if imageSource is not 'None'
      let imageUrl;
      if (imageSource && imageSource !== 'None') {
        // Generate image using Ideogram API ONLY
        const prompt = `${slideTitle} ${imageStyle || ''}`.trim();
        try {
          imageUrl = await searchBraveImage(prompt, imageStyle, idx);
        } catch (error) {
          console.error(`Failed to generate Ideogram image for slide ${idx}:`, error);
          // Don't use fallbacks, let the error propagate
          throw error;
        }
      }
      
      // Determine layout: first slide always left image, others random
      let layout;
      if (idx === 0) {
        layout = 'image-left';
      } else {
        const layoutOptions = ['image-left', 'image-right', 'image-bottom', 'text-only'];
        const randomIndex = Math.floor(Math.random() * layoutOptions.length);
        layout = layoutOptions[randomIndex];
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

    res.json({
      slides,
      meta: {
        title,
        amountOfText,
        imageSource,
        imageStyle
      }
    });
  } catch (error) {
    console.error('Generate slides error:', error);
    res.status(500).json({
      error: 'Failed to generate slides',
      message: 'Internal server error'
    });
  }
});

// Image generation endpoint using Ideogram API ONLY
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style, slideIndex } = req.body;
    
    console.log(`Generating image for slide ${slideIndex} with prompt: ${prompt}`);
    
    // Generate image using Ideogram API ONLY
          const imageUrl = await searchBraveImage(prompt, style, slideIndex);
    
    console.log(`✅ Successfully generated Ideogram image for slide ${slideIndex}: ${imageUrl}`);
    res.json({
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: 'Ideogram API failed. Please check your API key and try again.'
    });
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://${HOST}:${PORT}/api/auth`);
  console.log(`📝 Presentation endpoints: http://${HOST}:${PORT}/api/presentations`);
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler (must be last)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

export default app; 