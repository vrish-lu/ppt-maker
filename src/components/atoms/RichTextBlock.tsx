import React from 'react';

export interface RichTextBlockProps {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote';
  content: string;
  level?: 1 | 2 | 3; // For headings
  listType?: 'bullet' | 'numbered';
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onUpdate?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onAddBlock?: (id: string, type: 'heading' | 'paragraph' | 'list' | 'quote') => void;
  className?: string;
}

const RichTextBlock: React.FC<RichTextBlockProps> = ({
  id,
  type,
  content,
  level = 1,
  listType = 'bullet',
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onAddBlock,
  className = ''
}) => {
  const handleClick = () => {
    onSelect?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onAddBlock?.(id, 'paragraph');
    } else if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      onDelete?.(id);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    onUpdate?.(id, e.currentTarget.textContent || '');
  };

  const getBlockStyles = () => {
    const baseStyles = 'w-full min-h-[1.5em] outline-none focus:outline-none transition-all duration-200';
    
    switch (type) {
      case 'heading':
        const headingSizes = {
          1: 'text-3xl font-bold',
          2: 'text-2xl font-semibold',
          3: 'text-xl font-medium'
        };
        return `${baseStyles} ${headingSizes[level]} text-gray-900`;
      case 'paragraph':
        return `${baseStyles} text-base text-gray-700 leading-relaxed`;
      case 'list':
        return `${baseStyles} text-base text-gray-700 ml-6`;
      case 'quote':
        return `${baseStyles} text-lg text-gray-600 italic border-l-4 border-gray-300 pl-4`;
      default:
        return baseStyles;
    }
  };

  const renderContent = () => {
    if (type === 'list') {
      const listMarker = listType === 'bullet' ? '•' : `${id}.`;
      return (
        <div className="flex items-start">
          <span className="mr-2 text-gray-500 select-none">{listMarker}</span>
          <div
            contentEditable
            suppressContentEditableWarning
            className="flex-1 min-w-0"
            onInput={handleChange}
            onKeyDown={handleKeyDown}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      );
    }

    return (
      <div
        contentEditable
        suppressContentEditableWarning
        className={getBlockStyles()}
        onInput={handleChange}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} ${className}`}
      onClick={handleClick}
    >
      {renderContent()}
      
      {/* Add block button */}
      <div className={`absolute -bottom-2 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isSelected ? 'opacity-100' : ''}`}>
        <button
          className="w-6 h-6 bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.stopPropagation();
            onAddBlock?.(id, 'paragraph');
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RichTextBlock; 