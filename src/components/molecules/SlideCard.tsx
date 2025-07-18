import { useState } from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { SlideCardProps } from '../../types';

const SlideCard = ({ 
  slide, 
  onUpdate, 
  onRegenerate, 
  onRegenerateImage,
  isRegenerating = false,
  isRegeneratingImage = false,
  theme
}: SlideCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlide, setEditedSlide] = useState(slide);

  const handleSave = () => {
    onUpdate(editedSlide);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSlide(slide);
    setIsEditing(false);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditedSlide(prev => ({ ...prev, title: newTitle }));
  };

  const handleBulletChange = (index: number, newBullet: string) => {
    setEditedSlide(prev => ({
      ...prev,
      bullets: prev.bullets.map((bullet, i) => i === index ? newBullet : bullet)
    }));
  };

  const handleRegenerate = () => {
    onRegenerate(slide.id);
  };

  const handleRegenerateImage = () => {
    if (onRegenerateImage) {
      onRegenerateImage(slide.id);
    }
  };

  // Apply theme styling with improved contrast
  const getThemeStyles = () => {
    if (!theme) return {};
    
    // Ensure text has good contrast against background
    const getContrastTextColor = (backgroundColor: string, defaultTextColor: string) => {
      // For gradient backgrounds, use white text for better contrast
      if (backgroundColor.includes('gradient') || backgroundColor.includes('linear-gradient')) {
        return '#ffffff';
      }
      
      // For dark backgrounds, use light text
      if (backgroundColor === '#000000' || backgroundColor === '#111827' || backgroundColor === '#1f2937') {
        return '#ffffff';
      }
      
      // For light backgrounds, use dark text
      if (backgroundColor === '#ffffff' || backgroundColor === '#f9fafb') {
        return '#1f2937';
      }
      
      return defaultTextColor;
    };

    const textColor = getContrastTextColor(theme.colors.background, theme.colors.text);
    
    // Handle background image
    const backgroundStyle = theme.backgroundImage 
      ? {
          backgroundImage: `url(${theme.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          aspectRatio: '16/9',
          width: '100%',
          height: 'auto'
        }
      : {
          backgroundColor: theme.colors.background
        };

    // Get contrasting text colors for background image themes
    const getContrastingTextColors = () => {
      if (theme.id === 'modern-blue') {
        return {
          ...theme.colors,
          primary: '#1e40af',
          secondary: '#3b82f6',
          accent: '#60a5fa',
          text: '#1e3a8a'
        };
      }
      return theme.colors;
    };

    const contrastingColors = getContrastingTextColors();
    
    return {
      card: {
        ...backgroundStyle,
        color: contrastingColors.text,
        borderRadius: theme.styles.borderRadius === 'rounded-none' ? '0px' : 
                     theme.styles.borderRadius === 'rounded-md' ? '6px' :
                     theme.styles.borderRadius === 'rounded-lg' ? '8px' : '12px',
        boxShadow: theme.styles.shadow === 'shadow-sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                   theme.styles.shadow === 'shadow-md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: theme.styles.spacing === 'p-4' ? '16px' :
                 theme.styles.spacing === 'p-6' ? '24px' : '32px'
      },
      title: {
        color: contrastingColors.primary,
        fontFamily: theme.fonts.heading.family,
        fontWeight: theme.fonts.heading.weight,
        fontSize: theme.fonts.heading.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9), 0 0 4px rgba(255, 255, 255, 0.5)' : 'none'
      },
      bullet: {
        color: contrastingColors.accent,
        fontFamily: theme.fonts.accent?.family || theme.fonts.body.family,
        fontWeight: theme.fonts.accent?.weight || theme.fonts.body.weight,
        fontSize: theme.fonts.accent?.size || theme.fonts.body.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 'none'
      },
      text: {
        color: contrastingColors.text,
        fontFamily: theme.fonts.body.family,
        fontWeight: theme.fonts.body.weight,
        fontSize: theme.fonts.body.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 'none'
      },
      border: {
        borderColor: theme.backgroundImage 
          ? 'rgba(255, 255, 255, 0.2)' 
          : (theme.colors.background.includes('gradient') || theme.colors.background === '#000000' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.1)')
      }
    };
  };

  const themeStyles = getThemeStyles();

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 ${theme?.backgroundImage ? 'bg-image-optimized' : ''}`}
      style={themeStyles.card}
    >
      <div className="space-y-6">
        {/* Title at the top */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedSlide.title}
                onChange={handleTitleChange}
                placeholder="Slide title"
                maxLength={50}
                className="text-xl font-semibold"
                style={{ color: themeStyles.title?.color }}
              />
            ) : (
              <h3 
                className="text-xl font-semibold transition-colors"
                style={themeStyles.title}
              >
                {slide.title}
              </h3>
            )}
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  disabled={!editedSlide.title.trim()}
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                  loading={isRegenerating}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content area: Image and bullets side by side */}
        <div className="flex gap-6">
          {/* Image section (left side) */}
          {slide.image && !isEditing && (
            <div className="flex-shrink-0 w-1/2">
              <div className="relative">
                <img
                  src={slide.image.url}
                  alt={slide.image.alt}
                  className="w-full h-64 object-cover rounded-lg shadow-sm"
                />
                {onRegenerateImage && (
                  <div className="absolute bottom-2 right-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateImage}
                      loading={isRegeneratingImage}
                      disabled={isRegeneratingImage}
                      className="bg-white bg-opacity-90"
                    >
                      {isRegeneratingImage ? 'Generating...' : '🖼️'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bullet points section (right side) */}
          <div className={`flex-1 ${slide.image && !isEditing ? 'w-1/2' : 'w-full'}`}>
            <div className="space-y-3">
              {isEditing ? (
                // Edit mode - show input fields
                editedSlide.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span 
                      className="font-bold text-lg"
                      style={themeStyles.bullet}
                    >
                      •
                    </span>
                    <Input
                      value={bullet}
                      onChange={(value) => handleBulletChange(index, value)}
                      placeholder={`Bullet point ${index + 1}`}
                      maxLength={50}
                      className="flex-1"
                      style={themeStyles.text || {}}
                    />
                  </div>
                ))
              ) : (
                // View mode - show formatted bullets
                slide.bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span 
                      className="font-bold mt-1 text-lg"
                      style={themeStyles.bullet}
                    >
                      •
                    </span>
                    <p 
                      className="leading-relaxed text-base"
                      style={themeStyles.text || {}}
                    >
                      {bullet}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>


      </div>
    </Card>
  );
};

export default SlideCard; 