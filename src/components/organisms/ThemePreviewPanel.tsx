import React from 'react';
import { SlideCard as SlideCardType, ThemeTemplate } from '../../types';
import { defaultThemes } from '../../data/themes';

interface ThemePreviewPanelProps {
  slides: SlideCardType[];
  selectedTheme: ThemeTemplate;
  onThemeChange: (theme: ThemeTemplate) => void;
  onUpdateSlide: (updatedSlide: SlideCardType) => void;
  onRegenerateSlide: (slideId: string) => void;
  regeneratingSlides: Set<string>;
}

const ThemePreviewPanel: React.FC<ThemePreviewPanelProps> = ({
  slides,
  selectedTheme,
  onThemeChange,
  onUpdateSlide,
  onRegenerateSlide,
  regeneratingSlides
}) => {
  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white/90 border border-gamma-gray rounded-2xl shadow-xl p-6 mb-6 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gamma-dark">Theme Preview</h3>
        <p className="text-sm text-gamma-gray">Click any preview to apply that theme</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {defaultThemes.map((theme) => (
          <div
            key={theme.id}
            className={`relative group cursor-pointer transition-all duration-200 ${
              selectedTheme.id === theme.id 
                ? 'ring-2 ring-gamma-blue ring-offset-2' 
                : 'hover:ring-2 hover:ring-gamma-gray/50 ring-offset-2'
            }`}
            onClick={() => onThemeChange(theme)}
          >
            {/* Theme name overlay */}
            <div className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium text-gamma-dark">
              {theme.name}
            </div>
            
            {/* Selected indicator */}
            {selectedTheme.id === theme.id && (
              <div className="absolute top-2 right-2 z-20 bg-gamma-blue text-white rounded-full w-5 h-5 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Slides preview container */}
            <div className="relative overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
              <div className="space-y-2 p-3 max-h-48 overflow-y-auto">
                {slides.slice(0, 3).map((slide, index) => (
                  <div key={`${theme.id}-${slide.id}`} className="relative">
                    {/* Mini slide preview */}
                    <div 
                      className={`w-full h-16 rounded border overflow-hidden ${
                        theme.backgroundImage ? 'bg-image-optimized' : ''
                      } ${theme.backgroundGradient || ''}`}
                      style={{
                        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: theme.colors.background,
                        borderRadius: theme.styles.borderRadius === 'rounded-none' ? '0px' : 
                                     theme.styles.borderRadius === 'rounded-md' ? '6px' :
                                     theme.styles.borderRadius === 'rounded-lg' ? '8px' : '12px',
                        boxShadow: theme.styles.shadow === 'shadow-sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                                   theme.styles.shadow === 'shadow-md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                                   theme.styles.shadow === 'shadow-lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                                   theme.styles.shadow === 'shadow-xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' :
                                   theme.styles.shadow === 'shadow-2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                        padding: theme.styles.spacing === 'p-4' ? '8px' :
                                 theme.styles.spacing === 'p-6' ? '12px' : '16px',
                        textAlign: (theme.alignment === 'text-center' ? 'center' :
                                   theme.alignment === 'text-right' ? 'right' : 'left') as 'left' | 'center' | 'right'
                      }}
                    >
                      {/* Title preview */}
                      <div 
                        className="text-xs font-bold truncate mb-1"
                        style={{
                          color: theme.id === 'modern-blue' ? '#1e40af' :
                                 theme.id === 'tech-futuristic' ? '#00ffff' :
                                 theme.backgroundGradient ? '#36454f' :
                                 theme.backgroundImage ? (theme.colors?.primary || '#1f2937') :
                                 theme.colors.primary,
                          fontFamily: theme.fonts.heading.family,
                          fontWeight: theme.fonts.heading.weight,
                          fontSize: '10px',
                          textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 
                                     theme.id === 'tech-futuristic' ? '0 0 4px rgba(0, 255, 255, 0.8)' : 'none'
                        }}
                      >
                        {slide.title}
                      </div>
                      
                      {/* Bullet preview */}
                      <div 
                        className="text-xs truncate"
                        style={{
                          color: theme.id === 'modern-blue' ? '#1e3a8a' :
                                 theme.id === 'tech-futuristic' ? '#00ffff' :
                                 theme.backgroundGradient ? '#36454f' :
                                 theme.backgroundImage ? (theme.colors?.text || '#1f2937') :
                                 theme.colors.text,
                          fontFamily: theme.fonts.body.family,
                          fontWeight: theme.fonts.body.weight,
                          fontSize: '8px',
                          textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 
                                     theme.id === 'tech-futuristic' ? '0 0 3px rgba(0, 255, 255, 0.6)' : 'none'
                        }}
                      >
                        {slide.bullets[0] || 'Sample content...'}
                      </div>
                    </div>
                    
                    {/* Slide number indicator */}
                    <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* Show more slides indicator */}
                {slides.length > 3 && (
                  <div className="text-center text-xs text-gamma-gray py-2">
                    +{slides.length - 3} more slides
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemePreviewPanel; 