import { useState, useRef, useEffect } from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import { SlideCardProps } from '../../types';
import { getContrastingTextColors } from '../../utils/themeColors';

// Helper function to determine if a theme is dark
const isDarkTheme = (themeKey: string) => {
  const darkThemes = ['dark-mode', 'tech-futuristic', 'night-sky', 'ocean-deep'];
  return darkThemes.includes(themeKey);
};

const SlideCard = ({ 
  slide, 
  onUpdate, 
  onRegenerate, 
  onRegenerateImage,
  isRegenerating = false,
  isRegeneratingImage = false,
  theme
}: SlideCardProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingBullets, setEditingBullets] = useState<number | null>(null);
  const [editedSlide, setEditedSlide] = useState(slide);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bulletInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Drag/move state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number; direction?: string } | null>(null);

  // Mouse move/drag handlers for move
  useEffect(() => {
    if (!draggingId) return;
    const handleMove = (e: MouseEvent) => {
      const card = document.getElementById(`slide-card-${slide.id}`);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
      const updatedElements = (slide.elements || []).map(el =>
        el.id === draggingId ? { ...el, x: Math.max(0, Math.min(100 - el.w, x)), y: Math.max(0, Math.min(100 - el.h, y)) } : el
      );
      onUpdate({ ...slide, elements: updatedElements });
    };
    const handleUp = () => setDraggingId(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingId, dragOffset, slide, onUpdate]);

  // Helper for resizing from any direction
  const handleResizeAnyMouseDown = (e: React.MouseEvent, el: any, direction: string) => {
    e.stopPropagation();
    setResizingId(el.id);
    setResizeStart({ x: el.x, y: el.y, w: el.w, h: el.h, direction });
  };

  useEffect(() => {
    if (!resizingId || !resizeStart) return;
    const handleResize = (e: MouseEvent) => {
      const card = document.getElementById(`slide-card-${slide.id}`);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      let { x, y, w, h, direction } = resizeStart;
      let newX = x, newY = y, newW = w, newH = h;
      if (direction && direction.includes('e')) {
        newW = Math.max(5, Math.min(100 - x, px - x));
      }
      if (direction && direction.includes('s')) {
        newH = Math.max(5, Math.min(100 - y, py - y));
      }
      if (direction && direction.includes('w')) {
        newW = Math.max(5, Math.min(w + (x - px), w + x));
        newX = Math.max(0, Math.min(x + (px - x), x + w - 5));
      }
      if (direction && direction.includes('n')) {
        newH = Math.max(5, Math.min(h + (y - py), h + y));
        newY = Math.max(0, Math.min(y + (py - y), y + h - 5));
      }
      const updatedElements = (slide.elements || []).map(el =>
        el.id === resizingId ? { ...el, x: newX, y: newY, w: newW, h: newH } : el
      );
      onUpdate({ ...slide, elements: updatedElements });
    };
    const handleUp = () => setResizingId(null);
    window.addEventListener('mousemove', handleResize);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [resizingId, resizeStart, slide, onUpdate]);

  const handleElementMouseDown = (e: React.MouseEvent, el: any) => {
    e.stopPropagation();
    const card = document.getElementById(`slide-card-${slide.id}`);
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const offsetX = ((e.clientX - rect.left) / rect.width) * 100 - el.x;
    const offsetY = ((e.clientY - rect.top) / rect.height) * 100 - el.y;
    setDraggingId(el.id);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, el: any) => {
    e.stopPropagation();
    setResizingId(el.id);
    setResizeStart({ x: el.x, y: el.y, w: el.w, h: el.h });
  };

  const handleDeleteElement = (id: string) => {
    const updatedElements = (slide.elements || []).filter(el => el.id !== id);
    onUpdate({ ...slide, elements: updatedElements });
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (editingBullets !== null && bulletInputRefs.current[editingBullets]) {
      bulletInputRefs.current[editingBullets]?.focus();
      bulletInputRefs.current[editingBullets]?.select();
    }
  }, [editingBullets]);

  useEffect(() => {
    setImageLoaded(false);
  }, [theme, slide.image?.url]);

  const handleTitleSave = () => {
    if (editedSlide.title.trim()) {
      onUpdate(editedSlide);
    }
    setEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditedSlide(prev => ({ ...prev, title: slide.title }));
    setEditingTitle(false);
  };

  const handleBulletSave = (index: number) => {
    if (editedSlide.bullets[index]?.trim()) {
      onUpdate(editedSlide);
    }
    setEditingBullets(null);
  };

  const handleBulletCancel = (index: number) => {
    setEditedSlide(prev => ({
      ...prev,
      bullets: prev.bullets.map((bullet, i) => i === index ? slide.bullets[i] : bullet)
    }));
    setEditingBullets(null);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditedSlide(prev => ({ ...prev, title: newTitle }));
  };

  const handleBulletChange = (index: number, newBullet: string) => {
    setEditedSlide(prev => ({
      ...prev,
      bullets: prev.bullets.map((bullet, i) => i === index ? newBullet : bullet)
    }));
  };



  const handleTitleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleBulletKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      handleBulletSave(index);
    } else if (e.key === 'Escape') {
      handleBulletCancel(index);
    }
  };

  const handleRegenerate = () => {
    onRegenerate(slide.id);
  };

  const handleRegenerateImage = () => {
    if (onRegenerateImage) {
      onRegenerateImage(slide.id);
    }
  };

  // Handle drop of SVG element
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const svg = e.dataTransfer.getData('text/plain');
    if (!svg) return;
    // Calculate drop position as percent of area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newElement = {
      id: `element-${Date.now()}`,
      svg,
      x,
      y,
      w: 15, // default width percent
      h: 15, // default height percent
    };
    const updatedSlide = {
      ...slide,
      elements: [...(slide.elements || []), newElement],
    };
    onUpdate(updatedSlide);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Apply theme styling with improved contrast
  const getThemeStyles = () => {
    if (!theme) return {};
    
    // Ensure text has good contrast against background
    const getContrastTextColor = (backgroundColor: string, defaultTextColor: string) => {
      // For gradient backgrounds, use white text for better contrast
      if (backgroundColor.includes('gradient') || backgroundColor.includes('linear-gradient')) {
        return '#ffffff';
      }
      
      // For dark backgrounds, use light text
      if (backgroundColor === '#000000' || backgroundColor === '#111827' || backgroundColor === '#1f2937') {
        return '#ffffff';
      }
      
      // For light backgrounds, use dark text
      if (backgroundColor === '#ffffff' || backgroundColor === '#f9fafb') {
        return '#1f2937';
      }
      
      return defaultTextColor;
    };

    // const textColor = getContrastTextColor(theme.colors.background, theme.colors.text);
    
    // Handle background image or gradient
    const backgroundStyle = theme.backgroundImage 
      ? {
          backgroundImage: `url(${theme.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          aspectRatio: '16/9',
          width: '100%',
          height: 'auto'
        }
      : theme.backgroundGradient
      ? {
          // Apply gradient background using CSS classes
          aspectRatio: '16/9',
          width: '100%',
          height: 'auto'
        }
      : {
          backgroundColor: theme.colors.background
        };

    const contrastingColors = getContrastingTextColors(theme);
    
    return {
      card: {
        ...backgroundStyle,
        color: contrastingColors.text,
        borderRadius: theme.styles.borderRadius === 'rounded-none' ? '0px' : 
                     theme.styles.borderRadius === 'rounded-md' ? '6px' :
                     theme.styles.borderRadius === 'rounded-lg' ? '8px' : '12px',
        boxShadow: theme.styles.shadow === 'shadow-sm' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' :
                   theme.styles.shadow === 'shadow-md' ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-lg' ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-xl' ? '0 20px 25px -5px rgba(0, 0, 0, 0.1)' :
                   theme.styles.shadow === 'shadow-2xl' ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: theme.styles.spacing === 'p-4' ? '16px' :
                 theme.styles.spacing === 'p-6' ? '24px' : '32px',
        textAlign: (theme.alignment === 'text-center' ? 'center' :
                   theme.alignment === 'text-right' ? 'right' : 'left') as 'left' | 'center' | 'right'
      },
      title: {
        color: contrastingColors.primary,
        fontFamily: theme.fonts.heading.family,
        fontWeight: theme.fonts.heading.weight,
        fontSize: theme.fonts.heading.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9), 0 0 4px rgba(255, 255, 255, 0.5)' : 
                   theme.id === 'tech-futuristic' ? '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)' : 'none'
      },
      bullet: {
        color: contrastingColors.accent,
        fontFamily: theme.fonts.accent?.family || theme.fonts.body.family,
        fontWeight: theme.fonts.accent?.weight || theme.fonts.body.weight,
        fontSize: theme.fonts.accent?.size || theme.fonts.body.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 
                   theme.id === 'tech-futuristic' ? '0 0 8px rgba(255, 255, 0, 0.8), 0 0 16px rgba(255, 255, 0, 0.4)' : 'none'
      },
      text: {
        color: contrastingColors.text,
        fontFamily: theme.fonts.body.family,
        fontWeight: theme.fonts.body.weight,
        fontSize: theme.fonts.body.size,
        textShadow: theme.backgroundImage ? '1px 1px 2px rgba(255, 255, 255, 0.9)' : 
                   theme.id === 'tech-futuristic' ? '0 0 6px rgba(0, 255, 255, 0.6), 0 0 12px rgba(0, 255, 255, 0.3)' : 'none'
      },
      border: {
        borderColor: (theme.backgroundImage || theme.backgroundGradient)
          ? 'rgba(255, 255, 255, 0.2)' 
          : (theme.colors.background.includes('gradient') || theme.colors.background === '#000000' 
            ? 'rgba(255, 255, 255, 0.2)' 
            : 'rgba(0, 0, 0, 0.1)')
      }
    };
  };

  const themeStyles = getThemeStyles();

  // Enhanced Layout options with better icons
  const layoutOptions = [
    { 
      value: 'image-left', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="4" width="8" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="12" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="14" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="14" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ), 
      label: 'Image Left' 
    },
    { 
      value: 'image-right', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="14" y="4" width="8" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="2" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ), 
      label: 'Image Right' 
    },
    { 
      value: 'full-image', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.2"/>
          <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="2"/>
          <line x1="6" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ), 
      label: 'Full Image' 
    },
    { 
      value: 'text-only', 
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
          <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="4" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ), 
      label: 'Text Only' 
    },
                  { 
                value: 'title-only', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
                    <line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ), 
                label: 'Title Only' 
              },
              { 
                value: 'paragraph', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
                    <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ), 
                label: 'Paragraph' 
              },
                  { 
                value: 'split', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
                    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2"/>
                    <line x1="4" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ), 
                label: 'Split' 
              },
              { 
                value: 'image-bottom', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
                    <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                    <rect x="2" y="14" width="20" height="6" rx="1" fill="currentColor" opacity="0.2"/>
                  </svg>
                ), 
                label: 'Image Bottom' 
              },
              { 
                value: '2-columns', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="14" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="14" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ), 
                label: '2 Columns' 
              },
              { 
                value: '3-columns', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="11" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="18" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ), 
                label: '3 Columns' 
              },
              { 
                value: '4-columns', 
                icon: (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="17" y1="4" x2="17" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="9" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="14" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="19" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                ), 
                label: '4 Columns' 
              },
  ];

  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-200 ${theme?.backgroundImage ? 'bg-image-optimized' : ''} ${theme?.backgroundGradient || ''} relative`}
      style={themeStyles.card}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      id={`slide-card-${slide.id}`}
    >
      {/* Enhanced Layout Picker */}
      <div className="absolute right-4 top-4 flex gap-1 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-all duration-200 z-20">
        {layoutOptions.map(opt => (
          <button
            key={opt.value}
            className={`p-1.5 rounded-lg transition-all duration-150 ${
              ((slide.layout ?? 'image-left') === (opt.value as typeof slide.layout)) 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md scale-110' 
                : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
            }`}
            title={opt.label}
            onClick={() => onUpdate({ ...slide, layout: opt.value as typeof slide.layout })}
            type="button"
          >
            {opt.icon}
          </button>
        ))}
      </div>
      {/* Render SVG elements as overlays */}
      {slide.elements && slide.elements.map((el) => (
        <div
          key={el.id}
          style={{
            position: 'absolute',
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
            zIndex: 10,
            cursor: draggingId === el.id ? 'grabbing' : 'move',
            border: resizingId === el.id ? '2px solid #3a3aff' : 'none',
          }}
          onMouseDown={e => handleElementMouseDown(e, el)}
          tabIndex={0}
          className="group/element focus:outline-none"
        >
          <img
            src={el.svg}
            alt="Element"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
          {/* Resize handles: corners and sides */}
          {[
            { dir: 'nw', style: 'left-0 top-0 cursor-nwse-resize' },
            { dir: 'n',  style: 'left-1/2 -translate-x-1/2 top-0 cursor-ns-resize' },
            { dir: 'ne', style: 'right-0 top-0 cursor-nesw-resize' },
            { dir: 'e',  style: 'right-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
            { dir: 'se', style: 'right-0 bottom-0 cursor-nwse-resize' },
            { dir: 's',  style: 'left-1/2 -translate-x-1/2 bottom-0 cursor-ns-resize' },
            { dir: 'sw', style: 'left-0 bottom-0 cursor-nesw-resize' },
            { dir: 'w',  style: 'left-0 top-1/2 -translate-y-1/2 cursor-ew-resize' },
          ].map(h => (
            <div
              key={h.dir}
              className={`absolute w-4 h-4 bg-white border-2 border-gamma-blue rounded-full z-20 flex items-center justify-center opacity-0 group-hover/element:opacity-100 group-focus/element:opacity-100 transition-opacity ${h.style}`}
              style={{ pointerEvents: 'auto' }}
              onMouseDown={e => handleResizeAnyMouseDown(e, el, h.dir)}
            />
          ))}
          {/* Resize handle (bottom right) */}
          <div
            className="absolute right-0 bottom-0 w-6 h-6 bg-white border-2 border-gamma-blue rounded-full cursor-se-resize z-20 flex items-center justify-center opacity-0 group-hover/element:opacity-100 group-focus/element:opacity-100 transition-opacity"
            style={{ pointerEvents: 'auto' }}
            onMouseDown={e => handleResizeMouseDown(e, el)}
          >
            <svg className="w-4 h-4 text-gamma-blue" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 20h4v-4" /></svg>
          </div>
          {/* Delete button (top right, show on hover/focus) */}
          <button
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/element:opacity-100 group-focus/element:opacity-100 transition-opacity z-30 flex items-center justify-center"
            onClick={e => { e.stopPropagation(); handleDeleteElement(el.id); }}
            tabIndex={-1}
            title="Delete element"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}
      <div className="space-y-6">
        {/* Title at the top */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <textarea
              value={editedSlide.title}
              onChange={(e) => {
                setEditedSlide(prev => ({ ...prev, title: e.target.value }));
                onUpdate({ ...slide, title: e.target.value });
              }}
              placeholder="Slide title"
              className="w-full bg-transparent border-none outline-none resize-none overflow-hidden text-4xl font-bold"
              style={{
                minHeight: '3rem',
                maxHeight: '8rem',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                ...themeStyles.title
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              loading={isRegenerating}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
        {/* Content area: Render based on layout */}
        <div className="p-2.5"> {/* 10px padding (2.5 * 4px = 10px) */}
          {(() => {
            switch (slide.layout) {
              case 'image-left':
              default:
                return (
                  <div className="flex gap-6">
                  {slide.image && !editingTitle && editingBullets === null && (
                    <div className="flex-shrink-0 w-1/2">
                      <div className="relative">
                        <img
                          src={slide.image.url}
                          alt={slide.image.alt}
                          className={`w-full h-72 object-cover rounded-lg shadow-sm ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}
                          onLoad={() => setImageLoaded(true)}
                        />
                        {!imageLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 flex-1">
                    {editedSlide.bullets.map((bullet, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span 
                          className="font-bold mt-1 text-lg"
                          style={themeStyles.bullet}
                        >
                          •
                        </span>
                        <textarea
                          value={bullet}
                          onChange={(e) => {
                            setEditedSlide(prev => ({
                              ...prev,
                              bullets: prev.bullets.map((b, i) => i === index ? e.target.value : b)
                            }));
                            const updatedBullets = slide.bullets.map((b, i) => i === index ? e.target.value : b);
                            onUpdate({
                              ...slide,
                              bullets: updatedBullets
                            });
                          }}
                          placeholder={`Text ${index + 1}`}
                          className="flex-1 bg-transparent border-none outline-none resize-none text-lg"
                          style={{
                            minHeight: '4rem',
                            maxHeight: '32rem',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                            ...themeStyles.text
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            case 'image-right':
              return (
                <div className="flex gap-6 flex-row-reverse">
                  {slide.image && !editingTitle && editingBullets === null && (
                    <div className="flex-shrink-0 w-1/2">
                      <div className="relative">
                        <img
                          src={slide.image.url}
                          alt={slide.image.alt}
                          className={`w-full h-72 object-cover rounded-lg shadow-sm ${!imageLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}
                          onLoad={() => setImageLoaded(true)}
                        />
                        {!imageLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 flex-1">
                    {editedSlide.bullets.map((bullet, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span 
                          className="font-bold mt-1 text-lg"
                          style={themeStyles.bullet}
                        >
                          •
                        </span>
                        <textarea
                          value={bullet}
                          onChange={(e) => {
                            setEditedSlide(prev => ({
                              ...prev,
                              bullets: prev.bullets.map((b, i) => i === index ? e.target.value : b)
                            }));
                            const updatedBullets = slide.bullets.map((b, i) => i === index ? e.target.value : b);
                            onUpdate({
                              ...slide,
                              bullets: updatedBullets
                            });
                          }}
                          placeholder={`Text ${index + 1}`}
                          className="flex-1 bg-transparent border-none outline-none resize-none text-lg"
                          style={{
                            minHeight: '4rem',
                            maxHeight: '32rem',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                            ...themeStyles.text
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            case 'full-image':
              return (
                <div className="relative w-full h-72">
                  {slide.image && (
                    <img
                      src={slide.image.url}
                      alt={slide.image.alt}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-sm"
                      style={{ zIndex: 1 }}
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/30 rounded-lg">
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg mb-2" dangerouslySetInnerHTML={{ __html: slide.title }}></h3>
                    {editedSlide.bullets.map((bullet, index) => (
                      <p key={index} className="text-lg text-white/90 mb-1 drop-shadow-lg" dangerouslySetInnerHTML={{ __html: bullet }}></p>
                    ))}
                  </div>
                </div>
              );
            case 'text-only':
              return (
                <div className="space-y-3">
                  {editedSlide.bullets.map((bullet, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span 
                        className="font-bold mt-1 text-lg"
                        style={themeStyles.bullet}
                      >
                        •
                      </span>
                      <textarea
                        value={bullet}
                        onChange={(e) => {
                          setEditedSlide(prev => ({
                            ...prev,
                            bullets: prev.bullets.map((b, i) => i === index ? e.target.value : b)
                          }));
                          const updatedBullets = slide.bullets.map((b, i) => i === index ? e.target.value : b);
                          onUpdate({
                            ...slide,
                            bullets: updatedBullets
                          });
                        }}
                        placeholder={`Text ${index + 1}`}
                        className="flex-1 bg-transparent border-none outline-none resize-none text-lg"
                        style={{
                          minHeight: '4rem',
                          maxHeight: '32rem',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          overflowY: 'auto',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                          ...themeStyles.text
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            case 'title-only':
              return (
                <div className="flex items-center justify-center h-32">
                  <h3 className="text-3xl font-bold" style={themeStyles.title} dangerouslySetInnerHTML={{ __html: slide.title }}></h3>
                </div>
              );
            case 'paragraph':
              return (
                <div className="space-y-3">
                  {editedSlide.bullets.map((bullet, index) => (
                    <div key={index} className="w-full">
                      <textarea
                        value={bullet}
                        onChange={(e) => {
                          setEditedSlide(prev => ({
                            ...prev,
                            bullets: prev.bullets.map((b, i) => i === index ? e.target.value : b)
                          }));
                          const updatedBullets = slide.bullets.map((b, i) => i === index ? e.target.value : b);
                          onUpdate({
                            ...slide,
                            bullets: updatedBullets
                          });
                        }}
                        placeholder={`Paragraph ${index + 1}`}
                        className="w-full bg-transparent border-none outline-none resize-none text-lg"
                        style={{
                          minHeight: '8rem',
                          maxHeight: '40rem',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                          whiteSpace: 'pre-wrap',
                          overflowY: 'auto',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(0,0,0,0.3) transparent',
                          ...themeStyles.text
                        }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            case 'split':
              return (
                <div className="flex gap-2">
                  {slide.image && (
                    <div className="flex-1 flex items-center justify-center">
                      <img
                        src={slide.image.url}
                        alt={slide.image.alt}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <h3 className="text-xl font-semibold" style={themeStyles.title} dangerouslySetInnerHTML={{ __html: slide.title }}></h3>
                    {editedSlide.bullets.map((bullet, index) => (
                      <p key={index} className="text-base" style={themeStyles.text} dangerouslySetInnerHTML={{ __html: bullet }}></p>
                    ))}
                  </div>
                </div>
              );
          }
        })()}
        </div>
      </div>
    </Card>
  );
};

export default SlideCard; 