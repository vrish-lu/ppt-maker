import React, { useState, useRef, useEffect } from 'react';

export interface SlideRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  isTitle?: boolean;
  themeKey?: string;
  isDarkTheme?: boolean;
}

const SlideRichTextEditor: React.FC<SlideRichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false,
  isTitle = false,
  themeKey = 'modern-blue',
  isDarkTheme = false
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || '';
    }
  }, [content]);

  // Handle selection changes
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false);
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      setShowToolbar(false);
      return;
    }

    // Check if selection is within our editor
    if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setShowToolbar(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      console.log('Content changed:', newContent);
      onChange(newContent);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
    console.log('Editor focused');
  };

  const handleBlur = () => {
    setIsEditing(false);
    console.log('Editor blurred');
  };

  const handleClick = () => {
    if (!readOnly) {
      editorRef.current?.focus();
    }
  };

  const applyFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    if (command === 'heading') {
      // Remove existing heading and apply new one
      document.execCommand('formatBlock', false, `h${value}`);
    } else if (command === 'align') {
      document.execCommand('justify' + value.charAt(0).toUpperCase() + value.slice(1), false);
    } else {
      document.execCommand(command, false, value);
    }

    // Trigger change event
    handleInput();
  };

  const getTextColor = () => {
    return isDarkTheme ? 'text-white' : 'text-gray-900';
  };

  const getPlaceholderColor = () => {
    return isDarkTheme ? 'text-gray-400' : 'text-gray-500';
  };

  return (
    <div className="relative w-full">
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        className={`
          outline-none 
          ${isTitle ? 'text-2xl font-bold' : 'text-base'} 
          ${getTextColor()} 
          ${className}
          min-h-[1.5em]
          word-wrap break-word
          overflow-wrap break-word
          whitespace-pre-wrap
          cursor-text
          ${isEditing ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
          ${!content && !isEditing ? getPlaceholderColor() + ' italic' : ''}
        `}
        style={{
          minHeight: isTitle ? '2rem' : '1.5rem',
          maxHeight: isTitle ? '6rem' : '8rem',
        }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      >
        {content}
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1">
          Editing: {isEditing ? 'Yes' : 'No'} | 
          Content: {content ? 'Has content' : 'Empty'} |
          ReadOnly: {readOnly ? 'Yes' : 'No'}
        </div>
      )}

      {/* Floating toolbar */}
      {showToolbar && !readOnly && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1"
          style={{
            left: toolbarPosition.x,
            top: toolbarPosition.y - 60,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Text formatting */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <button
              onClick={() => applyFormat('bold')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 font-bold"
              title="Bold"
            >
              B
            </button>
            <button
              onClick={() => applyFormat('italic')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 italic"
              title="Italic"
            >
              I
            </button>
            <button
              onClick={() => applyFormat('underline')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 underline"
              title="Underline"
            >
              U
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <button
              onClick={() => applyFormat('heading', '1')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 font-bold text-lg"
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => applyFormat('heading', '2')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 font-semibold text-base"
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => applyFormat('heading', '3')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 font-medium text-sm"
              title="Heading 3"
            >
              H3
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
            <button
              onClick={() => applyFormat('insertUnorderedList')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 text-lg"
              title="Bullet List"
            >
              •
            </button>
            <button
              onClick={() => applyFormat('insertOrderedList')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150 font-mono"
              title="Numbered List"
            >
              1.
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat('align', 'left')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
              title="Left Align"
            >
              ⫷
            </button>
            <button
              onClick={() => applyFormat('align', 'center')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
              title="Center Align"
            >
              ⫸
            </button>
            <button
              onClick={() => applyFormat('align', 'right')}
              className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-700 hover:text-gray-900 transition-colors duration-150"
              title="Right Align"
            >
              ⫹
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideRichTextEditor; 