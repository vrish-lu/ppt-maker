import { ThemeTemplate } from '../types';

export const defaultThemes: ThemeTemplate[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme for business presentations',
    category: 'professional',
    colors: {
      primary: '#1e40af',
      secondary: '#1e3a8a',
      accent: '#3b82f6',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '600',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-lg',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-blue-600'
  },
  {
    id: 'creative-gradient',
    name: 'Creative Gradient',
    description: 'Vibrant gradient theme for creative and marketing presentations',
    category: 'creative',
    colors: {
      primary: '#333333',
      secondary: '#f3f4f6',
      accent: '#fbbf24',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '800',
        size: '1.75rem'
      },
      body: {
        family: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '600',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-xl',
      shadow: 'shadow-xl',
      spacing: 'p-8'
    },
   preview: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Simple and elegant minimal theme for clean presentations',
    category: 'minimal',
    colors: {
      primary: '#374151',
      secondary: '#4b5563',
      accent: '#6b7280',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '600',
        size: '1.5rem'
      },
      body: {
        family: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '300',
        size: '1rem'
      },
      accent: {
        family: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '500',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-md',
      shadow: 'shadow-sm',
      spacing: 'p-4'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-gray-500'
  },
  {
    id: 'business-green',
    name: 'Business Green',
    description: 'Professional green theme for corporate and financial presentations',
    category: 'business',
    colors: {
      primary: '#047857',  // Title color 
      secondary: '#065f46',  // Secondary text
      accent: '#059669',   // Bullet points color
      background: '#ffffff', // Background color
      text: '#047857' // Body text color 
    },
    fonts: {
      heading: {
        family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '700',
        size: '1.625rem'
      },
      body: {
        family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '500',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-green-600'
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    description: 'Sleek dark theme for modern and tech presentations',
    category: 'modern',
    colors: {
      primary: '#f9fafb',
      secondary: '#e5e7eb',
      accent: '#d1d5db',
      background: '#111827',
      text: '#f9fafb'
    },
    fonts: {
      heading: {
        family: 'JetBrains Mono, "Fira Code", "Cascadia Code", monospace',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'JetBrains Mono, "Fira Code", "Cascadia Code", monospace',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'JetBrains Mono, "Fira Code", "Cascadia Code", monospace',
        weight: '600',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-xl',
      shadow: 'shadow-2xl',
      spacing: 'p-8'
    },
    preview: 'bg-gray-800'
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    description: 'Energetic orange theme for motivational and team presentations',
    category: 'creative',
    colors: {
      primary: '#c2410c',
      secondary: '#9a3412',
      accent: '#ea580c',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '800',
        size: '1.75rem'
      },
      body: {
        family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '600',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-lg',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-orange-600'
  },
  {
    id: 'elegant-purple',
    name: 'Elegant Purple',
    description: 'Sophisticated purple theme for luxury and premium presentations',
    category: 'professional',
    colors: {
      primary: '#5b21b6',
      secondary: '#4c1d95',
      accent: '#7c3aed',
      background: '#ffffff',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'Playfair Display, Georgia, "Times New Roman", serif',
        weight: '700',
        size: '1.875rem'
      },
      body: {
        family: 'Lora, Georgia, "Times New Roman", serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Playfair Display, Georgia, "Times New Roman", serif',
        weight: '600',
        size: '1.375rem'
      }
    },
    styles: {
      borderRadius: 'rounded-xl',
      shadow: 'shadow-xl',
      spacing: 'p-8'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-purple-600'
  },
  {
    id: 'clean-white',
    name: 'Clean White',
    description: 'Pure white theme for maximum readability and simplicity',
    category: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#374151',
      accent: '#6b7280',
      background: '#ffffff',
      text: '#000000'
    },
    fonts: {
      heading: {
        family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        weight: '500',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-none',
      shadow: 'shadow-sm',
      spacing: 'p-4'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-black'
  }
];

export const getDefaultTheme = (): ThemeTemplate => defaultThemes[0]; 