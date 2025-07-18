// Core slide data structure
export type SlideCard = {
  id: string;
  title: string;
  bullets: string[];
  image?: {
    url: string;
    alt: string;
    source: 'ideogram' | 'unsplash' | 'icon';
    prompt?: string;
  };
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
};

// Presentation structure for download
export type Presentation = {
  id: string;
  title: string;
  slides: SlideCard[];
  theme: ThemeTemplate;
  createdAt: Date;
  updatedAt: Date;
};

// API response structure for OpenAI
export type SlideGenerationResponse = {
  slides: SlideCard[];
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
};

export type ThemeSelectorProps = {
  selectedTheme: ThemeTemplate;
  onThemeChange: (theme: ThemeTemplate) => void;
  themes: ThemeTemplate[];
}; 