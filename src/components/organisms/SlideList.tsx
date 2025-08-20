import { useState } from 'react';
import SlideCard from '../molecules/SlideCard';
import DownloadButton from '../molecules/DownloadButton';
import EditablePptxButton from '../molecules/EditablePptxButton';
import { SlideListProps } from '../../types';

const SlideList = ({ 
  slides, 
  onUpdateSlide, 
  onRegenerateSlide, 
  regeneratingSlides,
  theme,
  isDownloading = false,
  selectedSlideId,
  onSelectSlide
}: SlideListProps) => {
  const [presentationTitle, setPresentationTitle] = useState('My Presentation');

  if (slides.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No slides yet
        </h3>
        <p className="text-gray-500">
          Enter a topic above to generate your first presentation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Presentation
            </h2>
            {theme && (
              <div className="flex items-center space-x-2">
                <div 
                  className={`w-3 h-3 rounded-full ${theme.preview}`}
                  style={{
                    background: theme.colors.primary.startsWith('linear-gradient') 
                      ? theme.colors.primary 
                      : undefined
                  }}
                />
                <span className="text-sm text-gray-500">{theme.name}</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            {slides.length} slide{slides.length !== 1 ? 's' : ''} generated
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <DownloadButton
            slides={slides}
            title={presentationTitle}
            disabled={isDownloading}
          />
          <EditablePptxButton
            slides={slides}
            title={presentationTitle}
            theme={theme}
            disabled={isDownloading}
          />
        </div>
      </div>

      {/* Presentation Title Input */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Presentation Title
        </label>
        <input
          type="text"
          value={presentationTitle}
          onChange={(e) => setPresentationTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter presentation title..."
        />
      </div>

      {/* Slides container */}
      <div id="slides-preview-container" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`relative cursor-pointer transition-all duration-150 ${selectedSlideId === slide.id ? 'ring-2 ring-gamma-blue ring-offset-2' : 'hover:ring-2 hover:ring-gamma-gray/50 ring-offset-2'}`}
            onClick={() => onSelectSlide && onSelectSlide(slide.id)}
          >
            <SlideCard
              slide={slide}
              onUpdate={onUpdateSlide}
              onRegenerate={onRegenerateSlide}
              isRegenerating={regeneratingSlides.has(slide.id)}
              theme={theme}
            />
            {selectedSlideId === slide.id && (
              <div className="absolute top-2 right-2 z-20 bg-gamma-blue text-white rounded-full w-5 h-5 flex items-center justify-center">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Total slides: {slides.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlideList; 