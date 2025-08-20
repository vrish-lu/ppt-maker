import React, { useState, useEffect } from 'react';
import { OutlineItem } from '../../types';
import { defaultThemes } from '../../data/themes';
import regenImgIcon from '../../assets/regen-img-icon.webp';

interface PresentationViewProps {
  slides: OutlineItem[];
  currentSlideIndex: number;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onExitPresentation: () => void;
  selectedThemeKey: string;
  generatedImages: { [key: string]: string };
  THEME_PREVIEWS: any[];
  slideCardColor: string;
}

const PresentationView: React.FC<PresentationViewProps> = ({
  slides,
  currentSlideIndex,
  onNextSlide,
  onPrevSlide,
  onExitPresentation,
  selectedThemeKey,
  generatedImages,
  THEME_PREVIEWS,
  slideCardColor
}) => {
  const currentSlide = slides[currentSlideIndex];
  const currentImage = generatedImages[currentSlideIndex.toString()];
  const themePreview = THEME_PREVIEWS.find(t => t.key === selectedThemeKey);
  const theme = defaultThemes.find(t => t.id === selectedThemeKey);
  
  // Get theme colors for proper color application
  const titleColor = theme?.colors?.primary || '#1f2937';
  const bodyColor = theme?.colors?.text || '#374151';

  // State to track slide transitions and trigger animations
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [slideKey, setSlideKey] = React.useState(currentSlideIndex);

  // Trigger animation on slide change
  React.useEffect(() => {
    if (slideKey !== currentSlideIndex) {
      setIsTransitioning(true);
      setSlideKey(currentSlideIndex);
      
      // Reset transition after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 700); // Match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [currentSlideIndex, slideKey]);

  // Randomly select 2-3 slides to show icons (memoized for consistency)
  const slidesWithIcons = React.useMemo(() => {
    const numSlides = slides.length;
    const numSlidesWithIcons = Math.min(3, Math.max(2, Math.floor(numSlides * 0.3))); // 2-3 slides
    
    // Create array of slide indices
    const slideIndices = Array.from({ length: numSlides }, (_, i) => i);
    
    // Use a consistent seed based on slides content for reproducible randomness
    const seed = slides.map(slide => slide.title + slide.bullets.join('')).join('').length;
    const seededRandom = (max: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * max);
    };
    
    // Shuffle and take first 2-3
    for (let i = slideIndices.length - 1; i > 0; i--) {
      const j = seededRandom(i + 1);
      [slideIndices[i], slideIndices[j]] = [slideIndices[j], slideIndices[i]];
    }
    
    return slideIndices.slice(0, numSlidesWithIcons);
  }, [slides]);

  // Check if current slide should show icons
  const shouldShowIcons = slidesWithIcons.includes(currentSlideIndex);

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center animate-fade-in">
        <div className="text-white text-center animate-slide-up">
          <h1 className="text-4xl mb-4">No slides to present</h1>
          <button
            onClick={onExitPresentation}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Exit Presentation
          </button>
        </div>
      </div>
    );
  }

  const renderSlideContent = () => {
    const layout = currentSlide.layout || 'image-left';
    const title = currentSlide.title || '';
    const bullets = currentSlide.bullets || [];

    switch (layout) {
      case 'image-left':
        return (
          <div className="flex h-full">
            {/* Image Section */}
            <div className={`w-2/5 h-full flex items-center justify-center relative overflow-hidden p-4 ${isTransitioning ? 'animate-fade-in' : ''}`}>
              {currentImage ? (
                <div 
                  className="w-full h-full relative"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <img 
                    src={currentImage} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      clipPath: 'inherit'
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">
                      <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="text-sm font-medium">No Image</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="w-3/5 h-full p-16 flex flex-col justify-center">
              <div className={`mb-12 ${isTransitioning ? 'animate-fade-in-up' : ''}`}>
                <h1 
                  className="text-6xl font-bold leading-tight"
                  style={{
                    fontFamily: theme?.fonts.heading.family,
                    fontWeight: theme?.fonts.heading.weight,
                    fontSize: '68px',
                    color: titleColor
                  }}
                >
                  {title}
                </h1>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-8">
                {bullets.map((bullet, index) => (
                  <div key={index} className={`flex items-start space-x-6 ${isTransitioning ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: isTransitioning ? `${index * 0.1}s` : '0s' }}>
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-7 h-7 mt-2 flex items-center justify-center">
                        {getBulletIcon(index)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-7 h-7 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight,
                        color: bodyColor
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'text-only':
        return (
          <div className={`h-full p-20 flex flex-col justify-center max-w-6xl mx-auto ${isTransitioning ? 'animate-fade-in' : ''}`}>
            <div className={`mb-16 ${isTransitioning ? 'animate-fade-in' : ''}`}>
              <h1 
                className="text-7xl font-bold text-center leading-tight"
                style={{
                  fontFamily: theme?.fonts.heading.family,
                  fontWeight: theme?.fonts.heading.weight,
                  fontSize: '68px',
                  color: titleColor
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-10">
              {bullets.map((bullet, index) => (
                <div key={index} className={`flex items-start space-x-8 ${isTransitioning ? 'animate-fade-in' : ''}`} style={{ animationDelay: isTransitioning ? `${index * 0.08}s` : '0s' }}>
                  {shouldShowIcons ? (
                    <div className="flex-shrink-0 w-10 h-10 mt-2 flex items-center justify-center">
                      {getBulletIcon(index)}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 mt-2 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                  <p 
                    className="leading-relaxed"
                    style={{ 
                      fontSize: '27px',
                      fontFamily: theme?.fonts.body.family,
                      fontWeight: theme?.fonts.body.weight,
                      color: bodyColor
                    }}
                  >
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'image-right':
        return (
          <div className="flex h-full">
            {/* Content Section */}
            <div className="w-3/5 h-full p-16 flex flex-col justify-center">
              <div className={`mb-12 ${isTransitioning ? 'animate-fade-in-up' : ''}`}>
                <h1 
                  className="text-6xl font-bold leading-tight"
                  style={{
                    fontFamily: theme?.fonts.heading.family,
                    fontWeight: theme?.fonts.heading.weight,
                    fontSize: '68px',
                    color: titleColor
                  }}
                >
                  {title}
                </h1>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-8">
                {bullets.map((bullet, index) => (
                  <div key={index} className={`flex items-start space-x-6 ${isTransitioning ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: isTransitioning ? `${index * 0.1}s` : '0s' }}>
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        {getBulletIcon(index)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight,
                        color: bodyColor
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Image Section */}
            <div className={`w-2/5 h-full flex items-center justify-center relative overflow-hidden p-4 ${isTransitioning ? 'animate-fade-in' : ''}`}>
              {currentImage ? (
                <div 
                  className="w-full h-full relative"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <img 
                    src={currentImage} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      clipPath: 'inherit'
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">
                      <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="text-sm font-medium">No Image</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'image-top':
        return (
          <div className="h-full flex flex-col">
            {/* Image Section */}
            <div className="h-1/3 flex items-center justify-center relative overflow-hidden p-4">
              {currentImage ? (
                <div 
                  className="w-full h-full relative"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <img 
                    src={currentImage} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      clipPath: 'inherit'
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">
                      <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="text-sm font-medium">No Image</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Content Section */}
            <div className="h-2/3 p-16 flex flex-col justify-center">
              <div className="mb-12">
                <h1 
                  className="text-6xl font-bold leading-tight"
                  style={{
                    fontFamily: theme?.fonts.heading.family,
                    fontWeight: theme?.fonts.heading.weight,
                    fontSize: '68px',
                    color: titleColor
                  }}
                >
                  {title}
                </h1>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-8">
                {bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        {getBulletIcon(index)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight,
                        color: bodyColor
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'image-bottom':
        return (
          <div className="h-full flex flex-col">
            {/* Content Section */}
            <div className="h-2/3 p-16 flex flex-col justify-center">
              <div className="mb-12">
                <h1 
                  className="text-6xl font-bold leading-tight"
                  style={{
                    fontFamily: theme?.fonts.heading.family,
                    fontWeight: theme?.fonts.heading.weight,
                    fontSize: '68px',
                    color: titleColor
                  }}
                >
                  {title}
                </h1>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-8">
                {bullets.map((bullet, index) => (
                  <div key={index} className="flex items-start space-x-6">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        {getBulletIcon(index)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight,
                        color: bodyColor
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Image Section */}
            <div className="h-1/3 flex items-center justify-center relative p-4">
              {currentImage ? (
                <div 
                  className="w-full h-full relative"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <img 
                    src={currentImage} 
                    alt={title} 
                    className="w-full h-full object-cover"
                    style={{
                      borderRadius: 'inherit',
                      clipPath: 'inherit'
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-gray-200 flex items-center justify-center"
                  style={getImageEffect(selectedThemeKey, layout)}
                >
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">
                      <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                    </div>
                    <div className="text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case '2-columns':
        return (
          <div className="h-full p-16 flex flex-col justify-center">
            <div className="mb-12">
              <h1 
                className="text-6xl font-bold leading-tight text-center"
                style={{
                  fontFamily: theme?.fonts.heading.family,
                  fontWeight: theme?.fonts.heading.weight,
                  fontSize: '68px',
                  color: titleColor
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex-1 flex gap-16">
              <div className="w-1/2 flex flex-col justify-center space-y-8">
                {bullets.filter(bullet => bullet.trim() !== '').slice(0, Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex items-start space-x-6">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        {getBulletIcon(bulletIndex)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-gray-700 leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-8">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)} className="flex items-start space-x-6">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2))}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-8 h-8 mt-2 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-gray-700 leading-relaxed"
                      style={{ 
                        fontSize: '27px',
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case '3-columns':
        return (
          <div className="h-full p-8 flex flex-col justify-center">
            <div className="mb-6">
              <h1 
                className="text-3xl font-bold"
                style={{
                  fontFamily: theme?.fonts.heading.family,
                  fontWeight: theme?.fonts.heading.weight,
                  fontSize: '68px',
                  color: titleColor
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex-1 flex gap-6">
              <div className="w-1/3 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(0, Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 3)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        {getBulletIcon(bulletIndex)}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/3 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 3), Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 2 / 3)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 3)} className="flex items-start space-x-3 px-2">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 3))}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/3 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 2 / 3)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 2 / 3)} className="flex items-start space-x-3 px-2">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 2 / 3))}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case '4-columns':
        return (
          <div className="h-full p-8 flex flex-col justify-center">
            <div className="mb-6">
              <h1 
                className="text-3xl font-bold"
                style={{
                  fontFamily: theme?.fonts.heading.family,
                  fontWeight: theme?.fonts.heading.weight,
                  fontSize: '68px',
                  color: titleColor
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="w-1/4 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(0, Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 4)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      {getBulletIcon(bulletIndex)}
                    </div>
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/4 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 4), Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 4)} className="flex items-start space-x-3 px-2">
                    <div className="flex-shrink-0 w-5 h-5 mt-1">
                      {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 4))}
                    </div>
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/4 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2), Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 3 / 4)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)} className="flex items-start space-x-3 px-2">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2))}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
              <div className="w-1/4 flex flex-col justify-center space-y-4">
                {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 3 / 4)).map((bullet, bulletIndex) => (
                  <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 3 / 4)} className="flex items-start space-x-3 px-2">
                    {shouldShowIcons ? (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        {getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length * 3 / 4))}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 mt-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                    <p 
                      className="text-lg"
                      style={{
                        fontFamily: theme?.fonts.body.family,
                        fontWeight: theme?.fonts.body.weight
                      }}
                    >
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full p-20 flex flex-col justify-center max-w-6xl mx-auto">
            <div className="mb-16">
              <h1 
                className="text-7xl font-bold leading-tight text-center"
                style={{
                  fontFamily: theme?.fonts.heading.family,
                  fontWeight: theme?.fonts.heading.weight,
                  fontSize: '68px',
                  color: titleColor
                }}
              >
                {title}
              </h1>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-10">
              {bullets.map((bullet, index) => (
                <div key={index} className="flex items-start space-x-8">
                  {shouldShowIcons ? (
                    <div className="flex-shrink-0 w-10 h-10 mt-2 flex items-center justify-center">
                      {getBulletIcon(index)}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 mt-2 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                  <p 
                    className="leading-relaxed"
                    style={{ 
                      fontSize: '27px',
                      fontFamily: theme?.fonts.body.family,
                      fontWeight: theme?.fonts.body.weight,
                      color: bodyColor
                    }}
                  >
                    {bullet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  // Image effect system for dynamic layouts
  const getImageEffect = (themeKey: string, layout: string) => {
    const effects = {
      // Modern themes - Geometric effects
      'modern-blue': {
        transform: 'scale(1.02)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(59, 130, 246, 0.2)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        position: 'relative'
      },
      'modern-dark': {
        transform: 'scale(1.05)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(156, 163, 175, 0.3)',
        border: '2px solid rgba(156, 163, 175, 0.4)',
        position: 'relative'
      },
      'tech-cyber': {
        transform: 'scale(1.08)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 30px 60px rgba(16, 185, 129, 0.2), inset 0 0 0 1px rgba(16, 185, 129, 0.4)',
        border: '2px solid rgba(16, 185, 129, 0.6)',
        position: 'relative'
      },
      
      // Creative themes - Organic effects
      'creative-pink': {
        transform: 'scale(1.03)',
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        boxShadow: '0 15px 35px rgba(236, 72, 153, 0.2)',
        border: '2px solid rgba(236, 72, 153, 0.3)',
        position: 'relative'
      },
      'warm-orange': {
        transform: 'scale(1.04)',
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        boxShadow: '0 20px 40px rgba(251, 146, 60, 0.25)',
        border: '2px solid rgba(251, 146, 60, 0.4)',
        position: 'relative'
      },
      'luxury-gold': {
        transform: 'scale(1.06)',
        borderRadius: '50% 50% 50% 50% / 60% 40% 60% 40%',
        boxShadow: '0 25px 50px rgba(245, 158, 11, 0.3)',
        border: '3px solid rgba(245, 158, 11, 0.5)',
        position: 'relative'
      },
      
      // Professional themes - Subtle effects
      'corporate-blue': {
        transform: 'scale(1.02)',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.15)',
        border: '1px solid rgba(30, 58, 138, 0.2)',
        position: 'relative'
      },
      'business-green': {
        transform: 'scale(1.03)',
        borderRadius: '20px 5px 20px 5px',
        boxShadow: '0 15px 35px rgba(5, 122, 85, 0.2)',
        border: '2px solid rgba(5, 122, 85, 0.3)',
        position: 'relative'
      },
      
      // Minimal themes - Clean effects
      'clean-white': {
        transform: 'scale(1.01)',
        borderRadius: '8px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative'
      },
      'minimalist-black': {
        transform: 'scale(1.01)',
        borderRadius: '4px',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }
    };
    
    return effects[themeKey] || effects['clean-white'];
  };

  const getBulletIcon = (index: number) => {
    const icons = [
      // Lightning bolt - Blue
      <svg key="lightning" className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>,
      // Light bulb - Yellow
      <svg key="bulb" className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1-1H3a1 1 0 110 2h1a1 1 0 01-1-1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
      </svg>,
      // Target - Green
      <svg key="target" className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>,
      // Rocket - Purple
      <svg key="rocket" className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
      </svg>,
      // Star - Orange
      <svg key="star" className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>,
      // Key - Red
      <svg key="key" className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 8A6 6 0 006 8c0 3-2 5-2 5s2 2 2 5a6 6 0 0012 0c0-3 2-5 2-5s-2-2-2-5zM8 12a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
      </svg>,
      // Diamond - Pink
      <svg key="diamond" className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1a4 4 0 00-4 4v1H5a1 1 0 00-.78.375l-.805 1.086A.5.5 0 004.5 8H3a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1v-1h1a1 1 0 00.78-.375l.805-1.086A.5.5 0 008.5 8H9V5a4 4 0 00-4-4zm0 2a2 2 0 00-2 2v1h4V5a2 2 0 00-2-2z" clipRule="evenodd" />
      </svg>,
      // Fire - Red-Orange
      <svg key="fire" className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
      </svg>,
      // Gear - Gray
      <svg key="gear" className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>,
      // Trophy - Gold
      <svg key="trophy" className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>,
      // Crystal ball - Cyan
      <svg key="crystal" className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>,
      // Palette - Indigo
      <svg key="palette" className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ];
    return icons[index % icons.length];
  };

    return (
    <div
      className="fixed inset-0 z-50 presentation-mode animate-fade-in"
      style={{
        background: slideCardColor,
        fontFamily: theme?.fonts?.heading?.family || 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Slide Content */}
      <div className={`h-full w-full ${isTransitioning ? 'animate-fade-in' : ''}`}>
        {renderSlideContent()}
      </div>

      {/* Minimal Navigation Controls - Only show on hover */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-all duration-500 presentation-controls animate-fade-in">
        <div 
          className="flex items-center space-x-6 backdrop-blur-md rounded-full px-8 py-4 shadow-lg border transition-all duration-300 hover:scale-105"
          style={{
            backgroundColor: selectedThemeKey === 'modern-dark' ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: selectedThemeKey === 'modern-dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)'
          }}
        >
          <button
            onClick={onPrevSlide}
            disabled={currentSlideIndex === 0}
            className={`p-2 transition-all duration-300 hover:scale-110 disabled:cursor-not-allowed ${
              selectedThemeKey === 'modern-dark' 
                ? 'text-gray-300 hover:text-white disabled:text-gray-600' 
                : 'text-gray-600 hover:text-gray-900 disabled:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className={`font-medium text-sm ${
            selectedThemeKey === 'modern-dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {currentSlideIndex + 1} of {slides.length}
          </span>
          
          <button
            onClick={onNextSlide}
            disabled={currentSlideIndex === slides.length - 1}
            className={`p-2 transition-all duration-300 hover:scale-110 disabled:cursor-not-allowed ${
              selectedThemeKey === 'modern-dark' 
                ? 'text-gray-300 hover:text-white disabled:text-gray-600' 
                : 'text-gray-600 hover:text-gray-900 disabled:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Minimal Exit Button - Only show on hover */}
      <button
        onClick={onExitPresentation}
        className={`absolute top-8 right-8 p-3 backdrop-blur-md rounded-full transition-all duration-300 opacity-0 hover:opacity-100 shadow-lg border presentation-controls hover:scale-110 animate-fade-in ${
          selectedThemeKey === 'modern-dark' 
            ? 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 hover:text-white border-gray-600/50' 
            : 'bg-white/90 text-gray-600 hover:bg-white hover:text-gray-900 border-gray-200/50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Keyboard Shortcuts - Only show on hover */}
      <div 
        className={`absolute top-8 left-8 text-xs opacity-0 hover:opacity-100 transition-all duration-500 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg border presentation-controls animate-fade-in ${
          selectedThemeKey === 'modern-dark' 
            ? 'text-gray-400 bg-gray-800/90 border-gray-600/50' 
            : 'text-gray-500 bg-white/90 border-gray-200/50'
        }`}
      >
        <div className={`font-medium mb-1 ${
          selectedThemeKey === 'modern-dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>Shortcuts</div>
        <div>← → Navigate</div>
        <div>Space Next</div>
        <div>Esc Exit</div>
      </div>
    </div>
  );
};

export default PresentationView; 