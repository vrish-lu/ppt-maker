import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import FontSize from '@tiptap/extension-font-size';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import RichTextBlock from '../atoms/RichTextBlock';
import FloatingToolbar from '../molecules/FloatingToolbar';

export interface TextBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'quote';
  content: string;
  level?: 1 | 2 | 3;
  listType?: 'bullet' | 'numbered';
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  fontSize?: string;
}

export interface RichTextEditorProps {
  initialContent?: TextBlock[];
  onChange?: (blocks: TextBlock[]) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent = [],
  onChange,
  placeholder = 'Start typing...',
  className = '',
  readOnly = false
}) => {
  const [blocks, setBlocks] = useState<TextBlock[]>(initialContent);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with a default block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      const defaultBlock: TextBlock = {
        id: generateId(),
        type: 'paragraph',
        content: '',
        alignment: 'left'
      };
      setBlocks([defaultBlock]);
    }
  }, []);

  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleBlockSelect = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
  }, []);

  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    setBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block =>
        block.id === blockId ? { ...block, content } : block
      );
      onChange?.(updatedBlocks);
      return updatedBlocks;
    });
  }, [onChange]);

  const handleBlockDelete = useCallback((blockId: string) => {
    setBlocks(prevBlocks => {
      const filteredBlocks = prevBlocks.filter(block => block.id !== blockId);
      if (filteredBlocks.length === 0) {
        // Add a default block if all blocks are deleted
        const defaultBlock: TextBlock = {
          id: generateId(),
          type: 'paragraph',
          content: '',
          alignment: 'left'
        };
        filteredBlocks.push(defaultBlock);
      }
      onChange?.(filteredBlocks);
      return filteredBlocks;
    });
  }, [onChange]);

  const handleAddBlock = useCallback((afterBlockId: string, type: 'heading' | 'paragraph' | 'list' | 'quote') => {
    setBlocks(prevBlocks => {
      const newBlock: TextBlock = {
        id: generateId(),
        type,
        content: '',
        level: type === 'heading' ? 1 : undefined,
        listType: type === 'list' ? 'bullet' : undefined,
        alignment: 'left'
      };

      const blockIndex = prevBlocks.findIndex(block => block.id === afterBlockId);
      const newBlocks = [...prevBlocks];
      newBlocks.splice(blockIndex + 1, 0, newBlock);
      
      onChange?.(newBlocks);
      return newBlocks;
    });
  }, [onChange]);

  const handleFormatChange = useCallback((format: string, value?: any) => {
    if (!selectedBlockId) return;

    setBlocks(prevBlocks => {
      const updatedBlocks = prevBlocks.map(block => {
        if (block.id === selectedBlockId) {
          switch (format) {
            case 'heading':
              return { ...block, type: 'heading', level: value };
            case 'list':
              return { ...block, type: 'list', listType: value };
            case 'align':
              return { ...block, alignment: value };
            case 'color':
              return { ...block, color: value };
            case 'fontSize':
              return { ...block, fontSize: value };
            default:
              return block;
          }
        }
        return block;
      });
      onChange?.(updatedBlocks);
      return updatedBlocks;
    });
  }, [selectedBlockId, onChange]);

  // Handle text selection for floating toolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setToolbarVisible(false);
        setToolbarPosition(null);
        setSelectedText('');
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedTextContent = selection.toString().trim();

      if (selectedTextContent.length > 0) {
        const rect = range.getBoundingClientRect();
        setToolbarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        });
        setSelectedText(selectedTextContent);
        setToolbarVisible(true);
      } else {
        setToolbarVisible(false);
        setToolbarPosition(null);
        setSelectedText('');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Handle clicks outside to hide toolbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setToolbarVisible(false);
        setSelectedBlockId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderBlock = (block: TextBlock, index: number) => {
    const isSelected = selectedBlockId === block.id;
    
    return (
      <div key={block.id} className="mb-2">
        <RichTextBlock
          id={block.id}
          type={block.type}
          content={block.content}
          level={block.level}
          listType={block.listType}
          isSelected={isSelected}
          onSelect={handleBlockSelect}
          onUpdate={handleBlockUpdate}
          onDelete={handleBlockDelete}
          onAddBlock={handleAddBlock}
          className={`text-${block.alignment || 'left'}`}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="min-h-[200px] p-4 border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors duration-200">
        {blocks.length === 0 ? (
          <div className="text-gray-400 italic">{placeholder}</div>
        ) : (
          blocks.map(renderBlock)
        )}
      </div>

      <FloatingToolbar
        isVisible={toolbarVisible}
        position={toolbarPosition}
        onFormatChange={handleFormatChange}
        selectedText={selectedText}
      />
    </div>
  );
};

export default RichTextEditor; 