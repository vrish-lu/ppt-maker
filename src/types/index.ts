// Core slide data structure
export type SlideCard = {
  id: string;
  title: string;
  titleHtml?: string; // HTML content for rich text titles
  bullets: string[];
  bulletsHtml?: string[]; // HTML content for rich text bullets
  image?: {
    url: string;
    alt: string;
    source: 'ideogram' | 'unsplash' | 'icon';
    prompt?: string;
  };
  elements?: Array<{
    id: string;
    svg: string; // SVG path or import
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  layout?: 'image-left' | 'image-right' | 'image-bottom' | 'image-top' | 'full-image' | 'text-only' | 'title-only' | 'split' | '2-columns' | '3-columns' | '4-columns' | 'paragraph';
  background?: string; // e.g., 'light', 'dark', or custom color
  custom_styling?: any; // Add missing property
  content?: any; // Add missing property
  theme_info?: any; // Add missing property
};

// Theme template structure
export type ThemeTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'minimal' | 'modern' | 'professional';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: {
      family: string;
      weight: string;
      size: string;
    };
    body: {
      family: string;
      weight: string;
      size: string;
    };
    accent?: {
      family: string;
      weight: string;
      size: string;
    };
  };
  styles: {
    borderRadius: string;
    shadow: string;
    spacing: string;
  };
  preview: string; // CSS class or style preview
  backgroundImage?: string; // Optional background image URL
  backgroundGradient?: string; // Optional background gradient CSS class
  alignment?: string; // Optional text alignment (text-left, text-center, text-right)
};

// Presentation structure for download
export type Presentation = {
  id: string;
  title: string;
  slides: SlideCard[];
  theme: ThemeTemplate;
  theme_id?: string; // Add missing property
  createdAt: Date;
  updatedAt: Date;
};

// API response structure for OpenAI
export type SlideGenerationResponse = {
  slides: SlideCard[];
};

// Add missing types for generate functions
export type GenerateRequest = {
  topic: string;
  theme?: string;
  slides?: number;
};

export type GenerateResponse = {
  slides: SlideCard[];
  success: boolean;
  message?: string;
};

export type GenerateImageRequest = {
  prompt: string;
  style?: string;
};

export type GenerateImageResponse = {
  url: string;
  success: boolean;
  message?: string;
};

// Component props types
export type SlideCardProps = {
  slide: SlideCard;
  onUpdate: (updatedSlide: SlideCard) => void;
  onRegenerate: (slideId: string) => void;
  onRegenerateImage?: (slideId: string) => void;
  isRegenerating?: boolean;
  isRegeneratingImage?: boolean;
  theme?: ThemeTemplate;
};

export type TopicInputProps = {
  onGenerate: (topic: string) => void;
  isLoading?: boolean;
  selectedTheme?: ThemeTemplate;
  onThemeChange?: (theme: ThemeTemplate) => void;
};

export type SlideListProps = {
  slides: SlideCard[];
  onUpdateSlide: (updatedSlide: SlideCard) => void;
  onRegenerateSlide: (slideId: string) => void;
  regeneratingSlides: Set<string>;
  theme?: ThemeTemplate;
  onDownload?: (format: 'pdf' | 'pptx' | 'html') => void;
  isDownloading?: boolean;
  selectedSlideId?: string | null;
  onSelectSlide?: (slideId: string) => void;
};

// Outline item structure
export type OutlineItem = {
  title: string;
  bullets: string[];
  layout?: 'image-left' | 'image-right' | 'image-bottom' | 'image-top' | 'full-image' | 'text-only' | 'title-only' | 'split' | '2-columns' | '3-columns' | '4-columns' | 'paragraph';
  bulletsHtml?: string[]; // Add missing property
  titleHtml?: string; // Add missing property
  elements?: any[]; // Add missing property
};

export type ThemeSelectorProps = {
  selectedTheme: ThemeTemplate;
  onThemeChange: (theme: ThemeTemplate) => void;
  themes: ThemeTemplate[];
};

// Add missing types for ProfileModal
export type ProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  token: string;
  onProfileUpdate: (updatedUser: any) => void;
  onPresentationSelect?: (presentation: any) => void; // Make optional
  onLogout: () => void;
  onDeleteAccount: () => void;
};

// Add User type
export type User = {
  id: string;
  email: string;
  display_name?: string;
  name?: string;
  // Add other user properties as needed
};

// Add TextBlock type for RichTextEditor
export type TextBlock = {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote';
  content: string;
  level?: number;
  listType?: 'bullet' | 'numbered';
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: string;
}; 