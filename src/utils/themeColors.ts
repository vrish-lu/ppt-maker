// src/utils/themeColors.ts

// Enhanced font mapping for better Google Slides and PowerPoint compatibility
const GOOGLE_SLIDES_FONTS = {
  // Sans-serif fonts (natively available in Google Slides)
  'Arial': 'Arial',
  'Verdana': 'Verdana', 
  'Tahoma': 'Tahoma',
  'Trebuchet MS': 'Trebuchet MS',
  'Calibri': 'Calibri',
  'Cambria': 'Cambria',
  
  // Serif fonts (natively available in Google Slides)
  'Times New Roman': 'Times New Roman',
  'Georgia': 'Georgia',
  'Garamond': 'Garamond',
  
  // Monospace fonts (natively available in Google Slides)
  'Courier New': 'Courier New',
  'Courier': 'Courier New',
  'Monaco': 'Courier New',
  'Consolas': 'Courier New'
};

// Font mapping for web fonts to Google Slides compatible fonts
const FONT_MAPPING = {
  // Modern sans-serif fonts -> Arial (most compatible)
  'Inter': 'Arial',
  'Poppins': 'Arial',
  'Montserrat': 'Arial',
  'Open Sans': 'Arial',
  'Roboto': 'Arial',
  'Source Sans Pro': 'Arial',
  'Nunito': 'Arial',
  'Quicksand': 'Arial',
  'Rajdhani': 'Arial',
  'SF Pro Display': 'Arial',
  'SF Pro Text': 'Arial',
  'Helvetica Neue': 'Arial',
  'Helvetica': 'Arial',
  'Patrick Hand': 'Arial',
  
  // Serif fonts -> Times New Roman (most compatible)
  'Playfair Display': 'Times New Roman',
  'Crimson Text': 'Times New Roman',
  'Palatino': 'Times New Roman',
  'Baskerville': 'Times New Roman',
  'Libre Baskerville': 'Times New Roman',
  'Red Hat Text': 'Arial',
  'Hubot Sans': 'Arial',
  'Roboto Condensed': 'Arial',
  'Kanit': 'Arial',
  'Inconsolata': 'Courier New',
  'Alice': 'Times New Roman',
  
  // Monospace fonts -> Courier New
  'JetBrains Mono': 'Courier New',
  'Fira Code': 'Courier New',
  'Cascadia Code': 'Courier New',
  'Space Grotesk': 'Courier New',
  
  // Decorative fonts -> Arial
  'Orbitron': 'Arial',
  'Dancing Script': 'Arial',
  'Impact': 'Arial',
  'Comic Sans MS': 'Arial',
  
  // Fallback
  'default': 'Arial'
};

export function getContrastingTextColors(theme) {
  if (!theme) {
    return {
      title: '#000000',
      text: '#000000',
      bullet: '#000000',
      primary: '#000000',
      accent: '#000000',
    };
  }

  // Theme-specific color mappings for better contrast and readability
  const themeColorMappings = {
    'modern-blue': {
      title: '#1e40af',
      text: '#1e3a8a',
      bullet: '#3b82f6',
      primary: '#1e40af',
      accent: '#3b82f6',
    },
    'creative-gradient': {
      title: '#1f2937',
      text: '#374151',
      bullet: '#fbbf24',
      primary: '#1f2937',
      accent: '#fbbf24',
    },
    'minimal-gray': {
      title: '#374151',
      text: '#1f2937',
      bullet: '#6b7280',
      primary: '#374151',
      accent: '#6b7280',
    },
    'business-green': {
      title: '#047857',
      text: '#047857',
      bullet: '#059669',
      primary: '#047857',
      accent: '#059669',
    },
    'modern-dark': {
      title: '#f9fafb',
      text: '#f9fafb',
      bullet: '#d1d5db',
      primary: '#f9fafb',
      accent: '#d1d5db',
    },
    'warm-orange': {
      title: '#c2410c',
      text: '#1f2937',
      bullet: '#ea580c',
      primary: '#c2410c',
      accent: '#ea580c',
    },
    'elegant-purple': {
      title: '#ffffff',
      text: '#f3f4f6',
      bullet: '#d8b4fe',
      primary: '#4c1d95',
      accent: '#7c3aed',
    },
    'clean-white': {
      title: '#000000',
      text: '#000000',
      bullet: '#374151',
      primary: '#000000',
      accent: '#374151',
    },
    'tech-futuristic': {
      title: '#00ffff',
      text: '#00ffff',
      bullet: '#ffff00',
      primary: '#00ffff',
      accent: '#ffff00',
    },
    'vintage-retro': {
      title: '#8b4513',
      text: '#2f1b14',
      bullet: '#daa520',
      primary: '#8b4513',
      accent: '#daa520',
    },
    'corporate-blue': {
      title: '#1e3a8a',
      text: '#1e293b',
      bullet: '#60a5fa',
      primary: '#1e3a8a',
      accent: '#60a5fa',
    },

    'minimalist-black': {
      title: '#000000',
      text: '#000000',
      bullet: '#374151',
      primary: '#000000',
      accent: '#374151',
    },

    'luxury-gold': {
      title: '#92400e',
      text: '#451a03',
      bullet: '#d97706',
      primary: '#92400e',
      accent: '#d97706',
    },
    'tech-cyber': {
      title: '#10b981',
      text: '#10b981',
      bullet: '#6ee7b7',
      primary: '#10b981',
      accent: '#6ee7b7',
    },

    'flamingo': {
      title: '#1f1e1e',
      text: '#5e5858',
      bullet: '#e91e63',
      primary: '#1f1e1e',
      accent: '#e91e63',
    },
    'kraft': {
      title: '#282824',
      text: '#5f5f59',
      bullet: '#5f5f59',
      primary: '#282824',
      accent: '#5f5f59',
    },
    'daktilo': {
      title: '#151617',
      text: '#151617',
      bullet: '#151617',
      primary: '#151617',
      accent: '#151617',
    },
    'plant-shop': {
      title: '#233e32',
      text: '#45423c',
      bullet: '#45423c',
      primary: '#233e32',
      accent: '#45423c',
    }
  };

  // Return theme-specific colors if available
  if (theme.id && themeColorMappings[theme.id]) {
    return {
      ...theme.colors,
      ...themeColorMappings[theme.id]
    };
  }

  // Handle gradient backgrounds
  if (theme.backgroundGradient) {
    return {
      ...theme.colors,
      title: '#36454f',
      text: '#36454f',
      bullet: '#dc2626',
      primary: '#36454f',
      accent: '#dc2626',
    };
  }

  // Handle background images
  if (theme.backgroundImage) {
    return {
      ...theme.colors,
      title: theme.colors?.primary || '#1f2937',
      text: theme.colors?.text || '#1f2937',
      bullet: theme.colors?.accent || '#1f2937',
      primary: theme.colors?.primary || '#1f2937',
      accent: theme.colors?.accent || '#1f2937',
    };
  }

  // Default fallback
  return {
    ...theme.colors,
    title: theme.colors?.primary || '#000000',
    text: theme.colors?.text || '#000000',
    bullet: theme.colors?.accent || '#000000',
    primary: theme.colors?.primary || '#000000',
    accent: theme.colors?.accent || '#000000',
  };
}

// Enhanced font family mapping for better Google Slides compatibility
export function getFontFamily(theme, type = 'body') {
  if (!theme?.fonts) return 'Arial';
  
  const fontFamily = theme.fonts[type]?.family || theme.fonts.body?.family || 'Arial';
  const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  
  // Check if it's already a Google Slides compatible font
  if (GOOGLE_SLIDES_FONTS[firstFont]) {
    return GOOGLE_SLIDES_FONTS[firstFont];
  }
  
  // Map web fonts to Google Slides compatible fonts
  return FONT_MAPPING[firstFont] || FONT_MAPPING['default'];
}

// Enhanced font size calculation
export function getFontSize(theme, type = 'body') {
  if (!theme?.fonts) return type === 'heading' ? 28 : 18;
  
  const fontSize = theme.fonts[type]?.size || theme.fonts.body?.size || '1rem';
  
  // Convert CSS font size to PowerPoint font size
  if (fontSize.includes('rem')) {
    const remValue = parseFloat(fontSize);
    return Math.round(remValue * 16); // 1rem = 16px
  } else if (fontSize.includes('px')) {
    return parseInt(fontSize);
  } else if (fontSize.includes('em')) {
    const emValue = parseFloat(fontSize);
    return Math.round(emValue * 16); // 1em = 16px
  }
  
  // Default sizes
  return type === 'heading' ? 28 : 18;
}

// Enhanced text alignment mapping
export function getTextAlignment(theme) {
  if (!theme?.alignment) return 'left';
  
  // Handle both CSS classes and direct alignment values
  const alignment = theme.alignment;
  
  switch (alignment) {
    case 'text-center':
    case 'center':
    case 'centered':
      return 'center';
    case 'text-right':
    case 'right':
    case 'right-aligned':
      return 'right';
    case 'text-left':
    case 'left':
    case 'left-aligned':
      return 'left';
    case 'text-justify':
    case 'justify':
    case 'justified':
      return 'justify';
    default:
      return 'left';
  }
}

// Enhanced font weight mapping
export function getFontWeight(theme, type = 'body') {
  if (!theme?.fonts) return type === 'heading' ? 'bold' : 'normal';
  
  const weight = theme.fonts[type]?.weight || theme.fonts.body?.weight || '400';
  
  // Map CSS font weights to PowerPoint font weights
  const weightMap = {
    '100': 'normal',
    '200': 'normal',
    '300': 'normal',
    '400': 'normal',
    '500': 'normal',
    '600': 'bold',
    '700': 'bold',
    '800': 'bold',
    '900': 'bold',
    'normal': 'normal',
    'bold': 'bold',
    'bolder': 'bold',
    'lighter': 'normal'
  };
  
  return weightMap[weight] || 'normal';
}

// Color validation and normalization
export function normalizeColor(color) {
  if (!color) return '000000';
  
  // Remove # if present
  let normalized = color.replace('#', '');
  
  // Handle 3-digit hex colors
  if (normalized.length === 3) {
    normalized = normalized.split('').map(char => char + char).join('');
  }
  
  // Validate hex color
  if (/^[0-9A-Fa-f]{6}$/.test(normalized)) {
    return normalized.toUpperCase();
  }
  
  // Fallback to black
  return '000000';
}

// Enhanced color contrast calculation
export function getContrastColor(backgroundColor) {
  const normalized = normalizeColor(backgroundColor);
  
  // Convert hex to RGB
  const r = parseInt(normalized.substr(0, 2), 16);
  const g = parseInt(normalized.substr(2, 2), 16);
  const b = parseInt(normalized.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '000000' : 'FFFFFF';
} 