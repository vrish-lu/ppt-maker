import React, { useEffect, useRef, useState } from 'react';

export interface FloatingToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number } | null;
  onFormatChange: (format: string, value?: any) => void;
  selectedText: string;
  className?: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isVisible,
  position,
  onFormatChange,
  selectedText,
  className = ''
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (position && toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x;
      let y = position.y - 60; // Position above the selection
      
      // Adjust horizontal position if toolbar would go off-screen
      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }
      if (x < 10) {
        x = 10;
      }
      
      // Adjust vertical position if toolbar would go off-screen
      if (y < 10) {
        y = position.y + 20; // Position below the selection
      }
      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }
      
      setAdjustedPosition({ x, y });
    }
  }, [position]);

  if (!isVisible || !adjustedPosition) {
    return null;
  }

  const formatOptions = [
    {
      label: 'Heading 1',
      icon: 'H1',
      action: () => onFormatChange('heading', 1),
      className: 'font-bold text-lg'
    },
    {
      label: 'Heading 2',
      icon: 'H2',
      action: () => onFormatChange('heading', 2),
      className: 'font-semibold text-base'
    },
    {
      label: 'Heading 3',
      icon: 'H3',
      action: () => onFormatChange('heading', 3),
      className: 'font-medium text-sm'
    },
    {
      label: 'Bold',
      icon: 'B',
      action: () => onFormatChange('bold'),
      className: 'font-bold'
    },
    {
      label: 'Italic',
      icon: 'I',
      action: () => onFormatChange('italic'),
      className: 'italic'
    },
    {
      label: 'Underline',
      icon: 'U',
      action: () => onFormatChange('underline'),
      className: 'underline'
    },
    {
      label: 'Bullet List',
      icon: '•',
      action: () => onFormatChange('list', 'bullet'),
      className: 'text-lg'
    },
    {
      label: 'Numbered List',
      icon: '1.',
      action: () => onFormatChange('list', 'numbered'),
      className: 'font-mono'
    }
  ];

  const alignmentOptions = [
    {
      label: 'Left Align',
      icon: '⫷',
      action: () => onFormatChange('align', 'left'),
      className: 'text-left'
    },
    {
      label: 'Center Align',
      icon: '⫸',
      action: () => onFormatChange('align', 'center'),
      className: 'text-center'
    },
    {
      label: 'Right Align',
      icon: '⫹',
      action: () => onFormatChange('align', 'right'),
      className: 'text-right'
    }
  ];

  return (
    <div
      ref={toolbarRef}
      className={`fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1 transition-all duration-200 ${className}`}
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        transform: 'translateY(-50%)'
      }}
    >
      {/* Text formatting */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
        {formatOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.action}
            className={`w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 ${option.className}`}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
        {alignmentOptions.map((option, index) => (
          <button
            key={index}
            onClick={option.action}
            className={`w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 ${option.className}`}
            title={option.label}
          >
            {option.icon}
          </button>
        ))}
      </div>

      {/* Color picker */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFormatChange('color', '#000000')}
          className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
          title="Text Color"
        >
          <div className="w-4 h-4 bg-black rounded-sm"></div>
        </button>
        <button
          onClick={() => onFormatChange('color', '#3B82F6')}
          className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
          title="Blue"
        >
          <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
        </button>
        <button
          onClick={() => onFormatChange('color', '#EF4444')}
          className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
          title="Red"
        >
          <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
        </button>
        <button
          onClick={() => onFormatChange('color', '#10B981')}
          className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
          title="Green"
        >
          <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
        </button>
      </div>
    </div>
  );
};

export default FloatingToolbar; 