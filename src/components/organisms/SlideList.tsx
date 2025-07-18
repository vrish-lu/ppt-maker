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
  isDownloading = false
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
          <div key={slide.id} className="relative">
            <SlideCard
              slide={slide}
              onUpdate={onUpdateSlide}
              onRegenerate={onRegenerateSlide}
              isRegenerating={regeneratingSlides.has(slide.id)}
              theme={theme}
            />
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Total slides: {slides.length}
          </span>
          <span>
            ✨ AI-powered content generation
          </span>
        </div>
      </div>
    </div>
  );
};

export default SlideList; 