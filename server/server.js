import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI client with fallback for development
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

// Security middleware with custom configuration for image serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:5173", "http://localhost:3001"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:5173", "http://localhost:3001"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting - Disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
} else {
  console.log('Rate limiting disabled for development');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-development';
  const hasIdeogramKey = process.env.IDEOGRAM_API_KEY && process.env.IDEOGRAM_API_KEY !== 'your-ideogram-api-key-here';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'NewGamma API Server is running',
    openaiConfigured: hasOpenAIKey,
    ideogramConfigured: hasIdeogramKey,
    mode: hasOpenAIKey ? 'production' : 'development (mock data)',
    features: {
      aiContent: hasOpenAIKey,
      imageGeneration: hasIdeogramKey || 'unsplash_placeholders'
    }
  });
});

// Generate slides endpoint
app.post('/api/generate-slides', async (req, res) => {
  try {
    const { topic } = req.body;

    // Validate input
    if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
      return res.status(400).json({
        error: 'Invalid topic. Topic must be a string with at least 3 characters.'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
      console.log('OpenAI API key not configured, using mock data');
      const mockSlides = generateMockSlides(topic);
      return res.json({ slides: mockSlides });
    }

    const prompt = `Create a presentation outline for "${topic}" with 5-7 slides. 
    Each slide should have:
    - A clear, engaging title (max 8 words)
    - 3 bullet points (max 7 words each) that are informative and engaging
    
    Respond with ONLY a JSON array (no markdown formatting, no code blocks):
    [
      {
        "title": "Slide Title",
        "bullets": ["Bullet point 1", "Bullet point 2", "Bullet point 3"]
      }
    ]
    
    Make the content engaging and use Twitter-style language to make it relatable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert who creates engaging, informative slide content. Respond with ONLY valid JSON - no markdown formatting, no code blocks, just pure JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response text to handle markdown code blocks
    const cleanResponseText = responseText
      .replace(/```json\s*/g, '')  // Remove ```json
      .replace(/```\s*/g, '')      // Remove ``` at the end
      .trim();                     // Remove extra whitespace

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanResponseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      console.error('Cleaned response:', cleanResponseText);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    // Validate and transform the response
    if (!Array.isArray(parsedResponse)) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Transform to SlideCard format with UUIDs and generate images
    const slides = await Promise.all(parsedResponse.map(async (slide, index) => {
      const slideId = `slide-${Date.now()}-${index}`;
      const slideData = {
        id: slideId,
        title: slide.title || `Slide ${index + 1}`,
        bullets: Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3) : []
      };
      
      // Generate Ideogram image for the slide
      const imageUrl = await generateIdeogramImage(slideData.title, slideData.bullets);
      if (imageUrl) {
        slideData.image = {
          url: imageUrl,
          alt: `Illustration for ${slideData.title}`,
          source: 'ideogram',
          prompt: createImagePrompt(slideData.title, slideData.bullets)
        };
      }
      
      return slideData;
    }));

    res.json({ slides });

  } catch (error) {
    console.error('Error generating slides:', error);
    
    // Return mock data as fallback
    const mockSlides = await generateMockSlides(req.body.topic || 'Presentation');
    res.json({ slides: mockSlides });
  }
});

// Regenerate slide endpoint
app.post('/api/regenerate-slide', async (req, res) => {
  try {
    const { slideTitle } = req.body;

    // Validate input
    if (!slideTitle || typeof slideTitle !== 'string') {
      return res.status(400).json({
        error: 'Invalid slide title. Title must be a string.'
      });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-development') {
      console.log('OpenAI API key not configured, using mock data');
      const mockBullets = generateMockBullets();
      const imageUrl = await generateIdeogramImage(slideTitle, mockBullets);
      const mockSlide = {
        id: `slide-${Date.now()}`,
        title: slideTitle,
        bullets: mockBullets
      };
      
      if (imageUrl) {
        mockSlide.image = {
          url: imageUrl,
          alt: `Illustration for ${slideTitle}`,
          source: 'ideogram',
          prompt: createImagePrompt(slideTitle, mockBullets)
        };
      }
      
      return res.json({ slide: mockSlide });
    }

    const prompt = `Regenerate content for a slide titled "${slideTitle}". 
    Create 3 new bullet points (max 7 words each) that are informative and engaging.
    Use Twitter-style language to make it relatable.
    
    Respond with ONLY a JSON object (no markdown formatting, no code blocks):
    {
      "title": "${slideTitle}",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert. Respond with ONLY valid JSON - no markdown formatting, no code blocks, just pure JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response text to handle markdown code blocks
    const cleanResponseText = responseText
      .replace(/```json\s*/g, '')  // Remove ```json
      .replace(/```\s*/g, '')      // Remove ``` at the end
      .trim();                     // Remove extra whitespace

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanResponseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
      console.error('Cleaned response:', cleanResponseText);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    // Generate Ideogram image for the slide
    const imageUrl = await generateIdeogramImage(parsedResponse.title || slideTitle, parsedResponse.bullets || []);
    
    const slide = {
      id: `slide-${Date.now()}`,
      title: parsedResponse.title || slideTitle,
      bullets: Array.isArray(parsedResponse.bullets) ? parsedResponse.bullets.slice(0, 3) : []
    };
    
    if (imageUrl) {
      slide.image = {
        url: imageUrl,
        alt: `Illustration for ${parsedResponse.title || slideTitle}`,
        source: 'ideogram',
        prompt: createImagePrompt(parsedResponse.title || slideTitle, parsedResponse.bullets || [])
      };
    }

    res.json({ slide });

  } catch (error) {
    console.error('Error regenerating slide:', error);
    
    // Return mock data as fallback
    const mockBullets = generateMockBullets();
    const imageUrl = await generateIdeogramImage(req.body.slideTitle || 'Slide', mockBullets);
    const mockSlide = {
      id: `slide-${Date.now()}`,
      title: req.body.slideTitle || 'Slide',
      bullets: mockBullets
    };
    
    if (imageUrl) {
      mockSlide.image = {
        url: imageUrl,
        alt: `Illustration for ${req.body.slideTitle || 'Slide'}`,
        source: 'ideogram',
        prompt: createImagePrompt(req.body.slideTitle || 'Slide', mockBullets)
      };
    }
    
    res.json({ slide: mockSlide });
  }
});

// Generate mock slides for fallback
async function generateMockSlides(topic) {
  const slides = [
    {
      id: `slide-${Date.now()}-1`,
      title: `What is ${topic}?`,
      bullets: [
        "Breaking down the basics",
        "Why it matters today",
        "Real-world applications"
      ]
    },
    {
      id: `slide-${Date.now()}-2`,
      title: "Key Concepts Explained",
      bullets: [
        "Core principles",
        "How it works",
        "Benefits & advantages"
      ]
    },
    {
      id: `slide-${Date.now()}-3`,
      title: "Getting Started",
      bullets: [
        "First steps",
        "Tools you need",
        "Best practices"
      ]
    },
    {
      id: `slide-${Date.now()}-4`,
      title: "Common Challenges",
      bullets: [
        "What to watch out for",
        "Solutions & workarounds",
        "Pro tips"
      ]
    },
    {
      id: `slide-${Date.now()}-5`,
      title: "Next Steps",
      bullets: [
        "Where to go from here",
        "Resources & learning",
        "Community support"
      ]
    }
  ];

  // Generate Ideogram images for each slide
  const slidesWithImages = await Promise.all(slides.map(async (slide) => {
    const imageUrl = await generateIdeogramImage(slide.title, slide.bullets);
    const slideData = { ...slide };
    
    if (imageUrl) {
      slideData.image = {
        url: imageUrl,
        alt: `Illustration for ${slide.title}`,
        source: 'ideogram',
        prompt: createImagePrompt(slide.title, slide.bullets)
      };
    }
    // If no imageUrl, don't add image property at all
    
    return slideData;
  }));

  return slidesWithImages;
}

// Generate mock bullet points
function generateMockBullets() {
  return [
    "Fresh perspective on this topic",
    "Updated insights & trends",
    "Actionable next steps"
  ];
}

// Ideogram image generation functions
async function generateIdeogramImage(slideTitle, bullets) {
  try {
    const prompt = createImagePrompt(slideTitle, bullets);
    
    // Check if Ideogram API key is configured
    if (process.env.IDEOGRAM_API_KEY && process.env.IDEOGRAM_API_KEY !== 'your-ideogram-api-key-here') {
      return await callIdeogramAPI(prompt);
    } else {
      console.log('⚠️ Ideogram API not configured - no images will be generated');
      return null;
    }
  } catch (error) {
    console.error('Error generating Ideogram image:', error);
    console.log('⚠️ Ideogram API failed - no images will be generated');
    return null;
  }
}

function createImagePrompt(title, bullets) {
  const bulletText = bullets.join(', ');
  
  return `Professional presentation slide illustration for "${title}". 
  Modern, clean design with ${bullets.length} key concepts: ${bulletText}. 
  Corporate style, minimalist, suitable for business presentation. 
  High quality, professional, clean background, no text overlay.`;
}



// Download image locally and serve it
async function downloadImageLocally(imageUrl, prompt) {
  try {
    console.log('📥 Downloading image from:', imageUrl);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    // Generate a unique filename based on prompt and timestamp
    const timestamp = Date.now();
    const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const filename = `ideogram_${timestamp}_${sanitizedPrompt}.jpg`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Ensure uploads directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'uploads'))) {
      fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });
    }
    
    // Write the image to file
    fs.writeFileSync(filePath, Buffer.from(imageBuffer));
    console.log('💾 Image saved locally:', filePath);
    
    // Return the local URL
    const localUrl = `/api/images/${filename}`;
    console.log('🔗 Local image URL:', localUrl);
    
    return localUrl;
    
  } catch (error) {
    console.error('❌ Error downloading image locally:', error);
    return null;
  }
}

async function callIdeogramAPI(prompt) {
  try {
    console.log('🔍 Calling Ideogram API with prompt:', prompt);
    console.log('🔑 Using API key:', process.env.IDEOGRAM_API_KEY ? 'Configured' : 'Not configured');
    
    const requestBody = {
      prompt: prompt,
      rendering_speed: 'TURBO',
      aspect_ratio: '16x9',
      quality: 'standard'
    };
    
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env.IDEOGRAM_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error text:', errorText);
      throw new Error(`Ideogram API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('📥 Response data:', JSON.stringify(data, null, 2));
    
    // Check for image URL in response
    const imageUrl = data.data && data.data[0] && data.data[0].url;
    
    if (imageUrl) {
      console.log('✅ Successfully got image URL:', imageUrl);
      // Download the image locally
      const localImageUrl = await downloadImageLocally(imageUrl, prompt);
      return localImageUrl;
    } else {
      console.error('❌ No image URL in response data');
      throw new Error('No image URL returned from Ideogram API');
    }
    
  } catch (error) {
    console.error('❌ Ideogram API call failed:', error);
    throw error; // Don't fallback, just throw the error
  }
}

// Serve local images
app.get('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }
    
    // Set CORS headers for image serving
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Send the file
    res.sendFile(filePath);
    
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({
      error: 'Failed to serve image',
      message: error.message
    });
  }
});

// Serve images as data URLs for download purposes
app.get('/api/images/:filename/dataurl', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Image not found'
      });
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Read the file and convert to base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Assuming all images are JPEG
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    res.json({ dataUrl });
    
  } catch (error) {
    console.error('Error serving image as data URL:', error);
    res.status(500).json({
      error: 'Failed to serve image as data URL',
      message: error.message
    });
  }
});

// Save screenshot endpoint
app.post('/api/save-screenshot', upload.single('screenshot'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No screenshot file provided'
      });
    }

    // Return the file path for the saved screenshot
    res.json({
      success: true,
      filePath: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      message: 'Screenshot saved successfully'
    });

  } catch (error) {
    console.error('Error saving screenshot:', error);
    res.status(500).json({
      error: 'Failed to save screenshot',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/images/:filename',
      'POST /api/generate-slides',
      'POST /api/regenerate-slide',
      'POST /api/save-screenshot'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-development';
  const hasIdeogramKey = process.env.IDEOGRAM_API_KEY && process.env.IDEOGRAM_API_KEY !== 'your-ideogram-api-key-here';
  
  console.log(`🚀 NewGamma API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  
  if (hasOpenAIKey) {
    console.log(`✅ OpenAI API configured - AI features enabled`);
  } else {
    console.log(`⚠️  OpenAI API not configured - using mock data`);
    console.log(`   Add your API key to server/.env.local to enable AI features`);
  }
  
  if (hasIdeogramKey) {
    console.log(`✅ Ideogram API configured - Image generation enabled`);
  } else {
    console.log(`⚠️  Ideogram API not configured - using Unsplash placeholders`);
    console.log(`   Add your API key to server/.env.local to enable image generation`);
  }
}); 