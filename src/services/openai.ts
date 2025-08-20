import OpenAI from 'openai';
import { SlideCard } from '../types';

// Initialize OpenAI client (you'll need to set OPENAI_API_KEY in your environment)
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your-api-key-here',
  dangerouslyAllowBrowser: true, // Required for browser usage
});

/**
 * Generate slides based on a topic using GPT-4o-mini
 * @param topic - The presentation topic
 * @returns Promise<SlideCard[]> - Array of generated slides
 */
export const generateSlides = async (topic: string): Promise<SlideCard[]> => {
  try {
    const prompt = `Create a presentation outline for "${topic}" with 5-7 slides. 
    Each slide should have:
    - A clear, engaging title (max 8 words)
    - 3 bullet points (max 7 words each) that are informative and engaging
    
    Format the response as a JSON array with this structure:
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
          content: "You are a presentation expert who creates engaging, informative slide content , storylike structure. Always respond with valid JSON."
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

    // Parse the JSON response
    const parsedResponse = JSON.parse(responseText);
    
    // Validate and transform the response
    if (!Array.isArray(parsedResponse)) {
      throw new Error('Invalid response format');
    }

    // Transform to SlideCard format with UUIDs
    const slides: SlideCard[] = parsedResponse.map((slide, index) => ({
      id: `slide-${Date.now()}-${index}`,
      title: slide.title || `Slide ${index + 1}`,
      bullets: Array.isArray(slide.bullets) ? slide.bullets.slice(0, 3) : []
    }));

    return slides;

  } catch (error) {
    console.error('Error generating slides:', error);
    
    // Fallback to mock data if API fails
    return generateMockSlides(topic);
  }
};

/**
 * Regenerate content for a specific slide
 * @param slideTitle - The title of the slide to regenerate
 * @returns Promise<SlideCard> - The regenerated slide
 */
export const regenerateSlide = async (slideTitle: string): Promise<SlideCard> => {
  try {
    const prompt = `Regenerate content for a slide titled "${slideTitle}". 
    Create 3 new bullet points (max 7 words each) that are informative and engaging.
    Use Twitter-style language to make it relatable.
    
    Format as JSON:
    {
      "title": "${slideTitle}",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"]
    }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert. Always respond with valid JSON."
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

    const parsedResponse = JSON.parse(responseText);
    
    return {
      id: `slide-${Date.now()}`,
      title: parsedResponse.title || slideTitle,
      bullets: Array.isArray(parsedResponse.bullets) ? parsedResponse.bullets.slice(0, 3) : []
    };

  } catch (error) {
    console.error('Error regenerating slide:', error);
    
    // Fallback to mock data
    return {
      id: `slide-${Date.now()}`,
      title: slideTitle,
      bullets: generateMockBullets()
    };
  }
};

/**
 * Generate mock slides for development/testing
 * @param topic - The presentation topic
 * @returns SlideCard[] - Array of mock slides
 */
const generateMockSlides = (topic: string): SlideCard[] => {
  const mockSlides = [
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

  return mockSlides;
};

/**
 * Generate mock bullet points
 * @returns string[] - Array of mock bullet points
 */
const generateMockBullets = (): string[] => {
  const mockBullets = [
    "Fresh perspective on this topic",
    "Updated insights & trends",
    "Actionable next steps"
  ];
  
  return mockBullets;
}; 