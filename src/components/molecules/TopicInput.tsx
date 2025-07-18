import React, { useState } from 'react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import ThemeSelector from './ThemeSelector';
import { TopicInputProps, ThemeTemplate } from '../../types';
import { defaultThemes } from '../../data/themes';

const TopicInput = ({ 
  onGenerate, 
  isLoading = false, 
  selectedTheme = defaultThemes[0],
  onThemeChange 
}: TopicInputProps) => {
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate topic
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    
    if (topic.trim().length < 3) {
      setError('Topic must be at least 3 characters long');
      return;
    }
    
    setError('');
    onGenerate(topic.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleThemeChange = (theme: ThemeTemplate) => {
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Create Your Presentation
        </h2>
        <p className="text-gray-600">
          Enter a topic and let AI generate engaging slides for you
        </p>
      </div>
      
      {/* Topic Input */}
      <div className="space-y-2">
        <Input
          value={topic}
          onChange={setTopic}
          placeholder="e.g., Explain blockchain to beginners"
          label="Presentation Topic"
          error={error}
          disabled={isLoading}
          maxLength={100}
          required
          onKeyPress={handleKeyPress}
        />
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Choose Theme
        </label>
        <ThemeSelector
          selectedTheme={selectedTheme}
          onThemeChange={handleThemeChange}
          themes={defaultThemes}
        />
        <p className="text-xs text-gray-500">
          Select a theme to customize the look and feel of your presentation
        </p>
      </div>
      
      {/* Generate Button */}
      <Button
        type="submit"
        loading={isLoading}
        disabled={!topic.trim() || isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? 'Generating...' : 'Generate Slides'}
      </Button>
      
      {!isLoading && (
        <div className="text-sm text-gray-500">
          💡 Try topics like: "AI in healthcare", "Climate change solutions", "Startup funding strategies"
        </div>
      )}
    </form>
  );
};

export default TopicInput; 