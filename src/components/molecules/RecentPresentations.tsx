import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface Presentation {
  id: string;
  title: string;
  theme: string;
  slides: any[];
  created_at: string;
  updated_at: string;
}

interface RecentPresentationsProps {
  isOpen: boolean;
  onClose: () => void;
  onPresentationSelect: (presentation: Presentation) => void;
}

const RecentPresentations: React.FC<RecentPresentationsProps> = ({
  isOpen,
  onClose,
  onPresentationSelect
}) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ppt-maker-ezzr.onrender.com/api';

  useEffect(() => {
    if (isOpen && token) {
      fetchRecentPresentations();
    }
  }, [isOpen, token]);

  const fetchRecentPresentations = async () => {
    setIsLoading(true);
    setError('');
    
    console.log('🔐 Fetching presentations with token:', token ? 'Token exists' : 'No token');
    console.log('🌐 API URL:', `${API_BASE_URL}/presentations?limit=10`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/presentations?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Failed to fetch presentations: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);
      console.log('📊 Presentations data:', data.presentations);
      setPresentations(data.presentations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load presentations');
      console.error('Error fetching presentations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getSlideCount = (slides: any[] | undefined) => {
    if (!slides || !Array.isArray(slides)) return 0;
    return slides.length;
  };

  const getTotalBullets = (slides: any[] | undefined) => {
    if (!slides || !Array.isArray(slides)) return 0;
    return slides.reduce((total, slide) => {
      // Handle both backend structure (content.bullets) and frontend structure (bullets)
      const bullets = slide.content?.bullets || slide.bullets || [];
      return total + bullets.length;
    }, 0);
  };

  const getThemeColor = (theme: string | undefined) => {
    if (!theme) return 'bg-gray-100 text-gray-800';
    
    const themeColors: { [key: string]: string } = {
      'clean-white': 'bg-gray-100 text-gray-800',
      'modern-blue': 'bg-blue-100 text-blue-800',
      'creative-gradient': 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800',
      'minimal-gray': 'bg-gray-100 text-gray-800',
      'business-green': 'bg-green-100 text-green-800',
      'modern-dark': 'bg-gray-800 text-white',
      'warm-orange': 'bg-orange-100 text-orange-800',
      'kraft': 'bg-amber-100 text-amber-800',
      'daktilo': 'bg-red-100 text-red-800',
      'plant-shop': 'bg-emerald-100 text-emerald-800',
      'corporate-blue': 'bg-blue-100 text-blue-800',
      'minimalist-black': 'bg-gray-900 text-white',
      'luxury-gold': 'bg-yellow-100 text-yellow-800',
      'tech-cyber': 'bg-cyan-100 text-cyan-800',
      'flamingo': 'bg-pink-100 text-pink-800'
    };
    
    return themeColors[theme] || 'bg-gray-100 text-gray-800';
  };

  const getThemeDisplayName = (theme: string | undefined) => {
    if (!theme) return 'Default Theme';
    return theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Presentations</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-lg mb-4">{error}</div>
              <button
                onClick={fetchRecentPresentations}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : presentations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No presentations yet</div>
              <p className="text-gray-400">Create your first presentation to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presentations.map((presentation) => {
                try {
                  return (
                    <div
                      key={presentation.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105"
                      onClick={() => {
                        console.log('🎯 Presentation clicked:', presentation);
                        console.log('🎯 Presentation data structure:', {
                          id: presentation.id,
                          title: presentation.title,
                          theme_id: presentation.theme_id,
                          slides: presentation.slides,
                          slidesLength: presentation.slides?.length || 0
                        });
                        
                        // Check if slides have content
                        if (presentation.slides && presentation.slides.length > 0) {
                          console.log('✅ Slides found:', presentation.slides.length);
                          console.log('📋 First slide:', presentation.slides[0]);
                          console.log('📋 First slide bullets:', presentation.slides[0]?.content?.bullets || presentation.slides[0]?.bullets);
                        } else {
                          console.log('❌ No slides found in presentation');
                        }
                        
                        onPresentationSelect(presentation);
                      }}
                    >
                      {/* Theme Badge */}
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getThemeColor(presentation.theme_id)}`}>
                        {getThemeDisplayName(presentation.theme_id)}
                      </div>
                      
                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {presentation.title || 'Untitled Presentation'}
                      </h3>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex flex-col">
                          <span>{getSlideCount(presentation.slides || [])} slides</span>
                          <span className="text-xs">{getTotalBullets(presentation.slides || [])} bullets</span>
                        </div>
                        <span>{presentation.updated_at ? formatDate(presentation.updated_at) : 'Unknown date'}</span>
                      </div>
                      
                      {/* Preview with actual slide titles */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <div className="text-xs text-gray-600 mb-2">Content Preview</div>
                        <div className="space-y-1">
                          {(presentation.slides || []).slice(0, 2).map((slide, index) => (
                            <div key={index} className="text-xs text-gray-700 truncate">
                              {slide.title || `Slide ${index + 1}`}
                            </div>
                          ))}
                          {(presentation.slides || []).length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{(presentation.slides || []).length - 2} more slides
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action */}
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                        Open Presentation
                      </button>
                    </div>
                  );
                } catch (error) {
                  console.error('Error rendering presentation:', error, presentation);
                  return (
                    <div key={presentation.id} className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="text-red-600 text-sm">Error loading presentation</div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentPresentations;
