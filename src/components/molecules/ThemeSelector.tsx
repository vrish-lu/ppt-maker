import React, { useState } from 'react';
import { ThemeSelectorProps } from '../../types';

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onThemeChange,
  themes
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Themes' },
    { id: 'business', name: 'Business' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'modern', name: 'Modern' },
    { id: 'professional', name: 'Professional' }
  ];

  const filteredThemes = selectedCategory === 'all' 
    ? themes 
    : themes.filter(theme => theme.category === selectedCategory);

  return (
    <div className="relative">
      {/* Theme Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center space-x-3">
          <div 
            className={`w-4 h-4 rounded-full ${selectedTheme.preview}`}
            style={{
              background: selectedTheme.colors.primary.startsWith('linear-gradient') 
                ? selectedTheme.colors.primary 
                : undefined
            }}
          />
          <span className="text-sm font-medium text-gray-900">
            {selectedTheme.name}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Category Filter */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Options */}
          <div className="max-h-64 overflow-y-auto">
            {filteredThemes.map(theme => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors ${
                  selectedTheme.id === theme.id ? 'bg-blue-50' : ''
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full ${theme.preview}`}
                  style={{
                    background: theme.colors.primary.startsWith('linear-gradient') 
                      ? theme.colors.primary 
                      : undefined
                  }}
                />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {theme.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {theme.description}
                  </div>
                </div>
                {selectedTheme.id === theme.id && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ThemeSelector; 