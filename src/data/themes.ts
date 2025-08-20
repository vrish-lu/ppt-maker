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
      text: '#000000'
    },
    fonts: {
      heading: {
        family: 'Libre Baskerville, serif',
        weight: '400',
        size: '1.5rem'
      },
      body: {
        family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
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
    backgroundGradient: 'bg-gradient-to-r from-yellow-50 to-orange-500',
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
      background: '#e8e8e2',
      text: '#1f2937'
    },
    fonts: {
      heading: {
        family: 'Hubot Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'Roboto Condensed, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Roboto Condensed, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '400',
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
      primary: '#047857',
      secondary: '#065f46',
      accent: '#059669',
      background: '#ffffff',
      text: '#333333'
    },
    fonts: {
      heading: {
        family: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '300',
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
    backgroundImage: '/5.jpg',
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
        family: 'Patrick Hand, cursive, sans-serif',
        weight: '400',
        size: '1.75rem'
      },
      body: {
        family: 'Patrick Hand, cursive, sans-serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Patrick Hand, cursive, sans-serif',
        weight: '400',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-lg',
      spacing: 'p-6'
    },
    backgroundImage: '/5.jpg',
    preview: 'bg-orange-600'
  },
  {
    id: 'kraft',
    name: 'Kraft',
    description: 'Warm kraft paper-inspired theme with natural colors and clean typography',
    category: 'minimal',
    colors: {
      primary: '#282824',
      secondary: '#5f5f59',
      accent: '#5f5f59',
      background: '#eeece6',
      text: '#5f5f59'
    },
    fonts: {
      heading: {
        family: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-amber-700'
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
        family: 'Playfair Display, Georgia, serif',
        weight: '700',
        size: '1.5rem'
      },
      body: {
        family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  },
  {
    id: 'daktilo',
    name: 'Daktilo',
    description: 'Typewriter-inspired theme with monospace typography and vintage aesthetics',
    category: 'creative',
    colors: {
      primary: '#151617',
      secondary: '#151617',
      accent: '#151617',
      background: '#f8ebe4',
      text: '#151617'
    },
    fonts: {
      heading: {
        family: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '900',
        size: '1.75rem'
      },
      body: {
        family: 'Inconsolata, "Courier New", monospace',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Inconsolata, "Courier New", monospace',
        weight: '400',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-gray-800'
  },
  {
    id: 'plant-shop',
    name: 'Plant Shop',
    description: 'Natural plant-inspired theme with organic colors and elegant typography',
    category: 'creative',
    colors: {
      primary: '#233e32',
      secondary: '#45423c',
      accent: '#45423c',
      background: '#fcfbf7',
      text: '#45423c'
    },
    fonts: {
      heading: {
        family: 'Alice, serif',
        weight: '400',
        size: '1.75rem'
      },
      body: {
        family: 'Lora, Georgia, "Times New Roman", serif',
        weight: '400',
        size: '1rem'
      },
      accent: {
        family: 'Lora, Georgia, "Times New Roman", serif',
        weight: '400',
        size: '1.125rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-green-700'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Professional corporate theme with modern typography',
    category: 'professional',
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#ffffff',
      text: '#1e293b'
    },
    fonts: {
      heading: {
        family: 'Source Sans Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '700',
        size: '1.75rem'
      },
      body: {
        family: 'Source Sans Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Source Sans Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '600',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-blue-700'
  },

  {
    id: 'minimalist-black',
    name: 'Minimalist Black',
    description: 'Ultra-minimal black theme with clean typography',
    category: 'minimal',
    colors: {
      primary: '#000000',
      secondary: '#1f2937',
      accent: '#374151',
      background: '#ffffff',
      text: '#000000'
    },
    fonts: {
      heading: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '900',
        size: '2rem'
      },
      body: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '300',
        size: '1.125rem'
      },
      accent: {
        family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '500',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-none',
      shadow: 'shadow-sm',
      spacing: 'p-4'
    },
    backgroundImage: '/1.jpg',
    preview: 'bg-black'
  },

  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    description: 'Premium gold theme for luxury and high-end presentations',
    category: 'professional',
    colors: {
      primary: '#92400e',
      secondary: '#b45309',
      accent: '#d97706',
      background: '#fefce8',
      text: '#451a03'
    },
    fonts: {
      heading: {
        family: 'Crimson Text, Georgia, "Times New Roman", serif',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Crimson Text, Georgia, "Times New Roman", serif',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Crimson Text, Georgia, "Times New Roman", serif',
        weight: '600',
        size: '1.375rem'
      }
    },
    styles: {
      borderRadius: 'rounded-xl',
      shadow: 'shadow-xl',
      spacing: 'p-8'
    },
    backgroundGradient: 'bg-gradient-to-br from-amber-50 to-yellow-100',
    preview: 'bg-gradient-to-r from-amber-600 to-yellow-600'
  },
  {
    id: 'tech-cyber',
    name: 'Tech Cyber',
    description: 'Cyberpunk-inspired theme with neon colors and futuristic fonts',
    category: 'modern',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#6ee7b7',
      background: '#0f172a',
      text: '#10b981'
    },
    fonts: {
      heading: {
        family: 'Space Grotesk, "Courier New", monospace',
        weight: '700',
        size: '2rem'
      },
      body: {
        family: 'Space Grotesk, "Courier New", monospace',
        weight: '400',
        size: '1.125rem'
      },
      accent: {
        family: 'Space Grotesk, "Courier New", monospace',
        weight: '600',
        size: '1.375rem'
      }
    },
    styles: {
      borderRadius: 'rounded-none',
      shadow: 'shadow-2xl',
      spacing: 'p-8'
    },
    backgroundGradient: 'bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900',
    preview: 'bg-gradient-to-r from-emerald-500 to-green-500'
  },

  {
    id: 'flamingo',
    name: 'Flamingo',
    description: 'Elegant flamingo-inspired theme with warm colors and modern typography',
    category: 'creative',
    colors: {
      primary: '#1f1e1e',
      secondary: '#5e5858',
      accent: '#e91e63',
      background: '#fffafa',
      text: '#5e5858'
    },
    fonts: {
      heading: {
        family: 'Red Hat Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.75rem'
      },
      body: {
        family: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        weight: '300',
        size: '1.125rem'
      },
      accent: {
        family: 'Red Hat Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        weight: '400',
        size: '1.25rem'
      }
    },
    styles: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      spacing: 'p-6'
    },
    backgroundGradient: 'bg-gradient-to-br from-pink-50 to-rose-100',
    preview: 'bg-gradient-to-r from-pink-400 to-rose-400'
  }
];

export const getDefaultTheme = (): ThemeTemplate => defaultThemes[0]; 