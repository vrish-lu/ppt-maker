import { useState } from 'react';
import TopicInput from './components/molecules/TopicInput';
import SlideList from './components/organisms/SlideList';
import { SlideCard, ThemeTemplate } from './types';
import { generateSlides, regenerateSlide } from './services/api';
import { DownloadService } from './services/download';
import { getDefaultTheme } from './data/themes';

const App = () => {
  const [slides, setSlides] = useState<SlideCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSlides, setRegeneratingSlides] = useState<Set<string>>(new Set());
  const [selectedTheme, setSelectedTheme] = useState<ThemeTemplate>(getDefaultTheme());
  const [isDownloading, setIsDownloading] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState('My Presentation');

  // Generate new slides based on topic
  const handleGenerateSlides = async (topic: string) => {
    setIsGenerating(true);
    try {
      const newSlides = await generateSlides(topic);
      setSlides(newSlides);
      setPresentationTitle(topic);
    } catch (error) {
      console.error('Failed to generate slides:', error);
      // You could add a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  // Update a specific slide
  const handleUpdateSlide = (updatedSlide: SlideCard) => {
    setSlides(prevSlides => 
      prevSlides.map(slide => 
        slide.id === updatedSlide.id ? updatedSlide : slide
      )
    );
  };

  // Regenerate content for a specific slide
  const handleRegenerateSlide = async (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;

    setRegeneratingSlides(prev => new Set(prev).add(slideId));
    
    try {
      const regeneratedSlide = await regenerateSlide(slide.title);
      
      // Update the slide with new content but keep the original ID
      const updatedSlide = {
        ...regeneratedSlide,
        id: slideId // Keep the original ID to maintain position
      };
      
      setSlides(prevSlides => 
        prevSlides.map(s => 
          s.id === slideId ? updatedSlide : s
        )
      );
    } catch (error) {
      console.error('Failed to regenerate slide:', error);
      // You could add a toast notification here
    } finally {
      setRegeneratingSlides(prev => {
        const newSet = new Set(prev);
        newSet.delete(slideId);
        return newSet;
      });
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: ThemeTemplate) => {
    setSelectedTheme(theme);
  };

  // Handle download
  const handleDownload = async (format: 'pdf' | 'pptx' | 'html') => {
    if (slides.length === 0) {
      alert('No slides to download. Please generate some slides first.');
      return;
    }

    setIsDownloading(true);
    try {
              DownloadService.download(format, presentationTitle);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                NewGamma
              </h1>
              <span className="ml-2 text-sm text-gray-500">
                AI Presentation Builder
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Powered by GPT-4o-mini
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Topic input */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
              <TopicInput 
                onGenerate={handleGenerateSlides}
                isLoading={isGenerating}
                selectedTheme={selectedTheme}
                onThemeChange={handleThemeChange}
              />
            </div>
          </div>

          {/* Right panel - Slides */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <SlideList
                slides={slides}
                onUpdateSlide={handleUpdateSlide}
                onRegenerateSlide={handleRegenerateSlide}
                regeneratingSlides={regeneratingSlides}
                theme={selectedTheme}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Built with React, TypeScript, and Tailwind CSS • 
              AI-powered by OpenAI GPT-4o-mini
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App; 