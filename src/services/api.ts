import { SlideCard } from '../types';

// API base URL - change this for production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

/**
 * Generate slides based on a topic using the backend API
 * @param topic - The presentation topic
 * @param theme - The selected theme for styling
 * @returns Promise<SlideCard[]> - Array of generated slides
 */
export const generateSlides = async (topic: string, theme?: any): Promise<SlideCard[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-slides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic, theme }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform image URLs to use the full server URL
    const slides = data.slides || [];
    return slides.map(slide => ({
      ...slide,
      image: slide.image ? {
        ...slide.image,
        url: slide.image.url.startsWith('/api/') 
          ? `${API_BASE_URL}${slide.image.url.replace('/api/', '/')}`
          : slide.image.url
      } : undefined
    }));

  } catch (error) {
    console.error('Error generating slides:', error);
    
    // Fallback to mock data if API fails
    return generateMockSlides(topic);
  }
};

/**
 * Regenerate content for a specific slide using the backend API
 * @param slideTitle - The title of the slide to regenerate
 * @param theme - The selected theme for styling
 * @returns Promise<SlideCard> - The regenerated slide
 */
export const regenerateSlide = async (slideTitle: string, theme?: any): Promise<SlideCard> => {
  try {
    const response = await fetch(`${API_BASE_URL}/regenerate-slide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slideTitle, theme }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const slide = data.slide || {
      id: `slide-${Date.now()}`,
      title: slideTitle,
      bullets: generateMockBullets()
    };
    
    // Transform image URL to use the full server URL
    if (slide.image) {
      slide.image = {
        ...slide.image,
        url: slide.image.url.startsWith('/api/') 
          ? `${API_BASE_URL}${slide.image.url.replace('/api/', '/')}`
          : slide.image.url
      };
    }
    
    return slide;

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
 * Check if the API server is healthy
 * @returns Promise<boolean> - True if server is healthy
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
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