import React, { useState, useRef, useEffect, useCallback } from 'react';
import PresentationView from './components/organisms/PresentationView';
import './App.css';
import SlideCard from './components/atoms/Card';
import Stepper from './components/atoms/Stepper';
import SlideList from './components/organisms/SlideList';
import DownloadButton from './components/molecules/DownloadButton';
import EditablePptxButton from './components/molecules/EditablePptxButton';
import ScreenshotButton from './components/molecules/ScreenshotButton';
import ModernNavbar from './components/molecules/ModernNavbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/molecules/AuthModal';
import ProfileModal from './components/molecules/ProfileModal';
import RecentPresentations from './components/molecules/RecentPresentations';


import { ThemeTemplate, SlideCard as SlideCardType, OutlineItem } from './types';
import { getDefaultTheme } from './data/themes';
import TypingAnimation from './components/atoms/TypingAnimation';
import { ScreenshotService } from './services/screenshot';
import { DownloadService } from './services/download';
import pptxgen from 'pptxgenjs';
import html2canvas from 'html2canvas';
import { defaultThemes } from './data/themes';
import { 
  getContrastingTextColors, 
  getFontFamily, 
  getFontSize, 
  getTextAlignment, 
  getFontWeight,
  normalizeColor 
} from './utils/themeColors';
import pastelBg from './assets/images/pastel-bg.jpg';
import regenImgIcon from './assets/regen-img-icon.webp';

// ContentEditable component that preserves cursor position
const ContentEditableDiv = ({ 
  value, 
  onChange, 
  onBlur,
  className, 
  style,
  placeholder 
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  
  // Handle input changes
  const handleInput = useCallback(() => {
    if (ref.current) {
      const newValue = ref.current.textContent || '';
      lastValueRef.current = newValue;
      onChange(newValue);
    }
  }, [onChange]);
  
  // Handle blur
  const handleBlur = useCallback(() => {
    if (ref.current && onBlur) {
      const newValue = ref.current.textContent || '';
      onBlur(newValue);
    }
  }, [onBlur]);
  
  // Initialize content on mount
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value || '';
      lastValueRef.current = value || '';
    }
  }, []);

  // Update content only when value changes from external source
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value && lastValueRef.current !== value) {
      // Save cursor position
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const start = range?.startOffset || 0;
      const end = range?.endOffset || 0;
      
      // Update content
      ref.current.textContent = value;
      lastValueRef.current = value;
      
      // Restore cursor position if element is focused
      if (document.activeElement === ref.current && ref.current.firstChild) {
        try {
          const newRange = document.createRange();
          const textNode = ref.current.firstChild;
          const textLength = textNode.textContent?.length || 0;
          
          newRange.setStart(textNode, Math.min(start, textLength));
          newRange.setEnd(textNode, Math.min(end, textLength));
          
          selection?.removeAllRanges();
          selection?.addRange(newRange);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [value]);
  
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      className={className}
      style={style}
      data-placeholder={placeholder}
    />
  );
};

// Controlled Textarea component with proper cursor handling
const ControlledTextarea = ({
  value,
  onChange,
  onFocus,
  onClick,
  className,
  style,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);
  
  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Auto-resize textarea
  const autoResize = useCallback(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, []);
  
  // Handle change with cursor position preservation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setLocalValue(newValue);
    onChange(newValue);
    
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.selectionStart = cursorPos;
        ref.current.selectionEnd = cursorPos;
        autoResize();
      }
    });
  }, [onChange, autoResize]);
  
  // Auto-resize on mount and value changes
  useEffect(() => {
    autoResize();
  }, [localValue, autoResize]);
  
  return (
    <textarea
      ref={ref}
      value={localValue}
      onChange={handleChange}
      onFocus={onFocus}
      onClick={onClick}
      className={className}
      style={style}
      placeholder={placeholder}
    />
  );
};

const STEPS = [
  { label: 'Create', description: 'Start your presentation' },
  { label: 'Generate Content', description: 'AI-powered content' },
  { label: 'Outline', description: 'Review and edit structure' },
  { label: 'Customize', description: 'Fine-tune design' },
  { label: 'Generate Slides', description: 'Create final slides' }
];

const THEME_PREVIEWS = [
  {
    key: 'modern-blue',
    label: 'Modern Blue',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Libre Baskerville, serif',
      borderColor: '#1e40af'
    },
    titleClass: 'text-2xl font-bold text-blue-800 mb-1 font-libre-baskerville',
    bodyClass: 'text-base text-black font-opensans',
    border: 'border-blue-600',
  },
  {
    key: 'creative-gradient',
    label: 'Creative Gradient',
    style: { 
      background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)', 
      fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#fbbf24'
    },
    titleClass: 'text-2xl font-bold text-gray-800 mb-1',
    bodyClass: 'text-base text-gray-700',
    border: 'border-yellow-400',
  },
  {
    key: 'minimal-gray',
    label: 'Minimal Gray',
    style: { 
      background: '#e8e8e2', 
      fontFamily: 'Hubot Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#374151'
    },
    titleClass: 'text-2xl font-bold text-gray-700 mb-1 font-hubot-sans',
    bodyClass: 'text-base text-gray-600 font-roboto-condensed',
    border: 'border-gray-500',
  },
  {
    key: 'business-green',
    label: 'Business Green',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Kanit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#047857'
    },
    titleClass: 'text-2xl font-light text-green-700 mb-1 font-kanit',
    bodyClass: 'text-base text-gray-800',
    border: 'border-green-600',
  },
  {
    key: 'modern-dark',
    label: 'Modern Dark',
    style: { 
      background: '#111827', 
      fontFamily: 'JetBrains Mono, "Fira Code", "Cascadia Code", monospace',
      borderColor: '#374151'
    },
    titleClass: 'text-2xl font-bold text-white mb-1',
    bodyClass: 'text-base text-gray-300',
    border: 'border-gray-600',
  },
  {
    key: 'warm-orange',
    label: 'Warm Orange',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Patrick Hand, cursive, sans-serif',
      borderColor: '#c2410c'
    },
    titleClass: 'text-2xl font-bold text-orange-700 mb-1',
    bodyClass: 'text-base text-gray-700',
    border: 'border-orange-600',
  },
  {
    key: 'kraft',
    label: 'Kraft',
    style: { 
      background: '#eeece6', 
      fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#282824'
    },
    titleClass: 'text-2xl font-bold text-gray-800 mb-1 font-lato',
    bodyClass: 'text-base text-gray-600 font-lato',
    border: 'border-gray-700',
  },
  {
    key: 'clean-white',
    label: 'Clean White',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Open Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#000000'
    },
    titleClass: 'text-2xl font-bold text-black mb-1 font-playfair',
    bodyClass: 'text-base text-black font-opensans',
    border: 'border-black',
  },
  {
    key: 'daktilo',
    label: 'Daktilo',
    style: { 
      background: '#f8ebe4', 
      fontFamily: 'Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#151617'
    },
    titleClass: 'text-2xl font-black text-gray-900 mb-1 font-montserrat',
    bodyClass: 'text-base text-gray-900 font-inconsolata',
    border: 'border-gray-800',
  },
  {
    key: 'plant-shop',
    label: 'Plant Shop',
    style: { 
      background: '#fcfbf7', 
      fontFamily: 'Alice, serif',
      borderColor: '#233e32'
    },
    titleClass: 'text-2xl font-normal text-green-800 mb-1 font-alice',
    bodyClass: 'text-base text-gray-700 font-lora',
    border: 'border-green-700',
  },
  {
    key: 'corporate-blue',
    label: 'Corporate Blue',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Source Sans Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#1e3a8a'
    },
    titleClass: 'text-2xl font-bold text-blue-900 mb-1',
    bodyClass: 'text-base text-slate-700',
    border: 'border-blue-700',
  },

  {
    key: 'minimalist-black',
    label: 'Minimalist Black',
    style: { 
      background: '#ffffff', 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#000000'
    },
    titleClass: 'text-3xl font-black text-black mb-1',
    bodyClass: 'text-base text-black font-light',
    border: 'border-black',
  },

  {
    key: 'luxury-gold',
    label: 'Luxury Gold',
    style: { 
      background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', 
      fontFamily: 'Crimson Text, Georgia, "Times New Roman", serif',
      borderColor: '#92400e'
    },
    titleClass: 'text-2xl font-bold text-amber-900 mb-1',
    bodyClass: 'text-base text-amber-800',
    border: 'border-amber-600',
  },
  {
    key: 'tech-cyber',
    label: 'Tech Cyber',
    style: { 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
      fontFamily: 'Space Grotesk, "Courier New", monospace',
      borderColor: '#10b981'
    },
    titleClass: 'text-2xl font-bold text-emerald-400 mb-1',
    bodyClass: 'text-base text-emerald-300',
    border: 'border-emerald-500',
  },

  {
    key: 'flamingo',
    label: 'Flamingo',
    style: { 
      background: '#fffafa', 
      fontFamily: 'Red Hat Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderColor: '#e91e63'
    },
    titleClass: 'text-2xl font-bold text-gray-900 mb-1 font-redhat-text',
    bodyClass: 'text-base text-gray-600 font-light font-roboto-light',
    border: 'border-pink-400',
  }
];

// Function to get different icons for bullet points
const getBulletIcon = (index: number) => {
  const icons = [
    // Lightning bolt - Blue
    <svg key="lightning" className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>,
    // Light bulb - Yellow
    <svg key="bulb" className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1-1H3a1 1 0 110 2h1a1 1 0 01-1-1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>,
    // Target - Green
    <svg key="target" className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>,
    // Rocket - Purple
    <svg key="rocket" className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
    </svg>,
    // Star - Orange
    <svg key="star" className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>,
    // Key - Red
    <svg key="key" className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 8A6 6 0 006 8c0 3-2 5-2 5s2 2 2 5a6 6 0 0012 0c0-3 2-5 2-5s-2-2-2-5zM8 12a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
    </svg>,
    // Diamond - Pink
    <svg key="diamond" className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 1a4 4 0 00-4 4v1H5a1 1 0 00-.78.375l-.805 1.086A.5.5 0 004.5 8H3a1 1 0 00-1 1v6a1 1 0 001 1h1a1 1 0 001-1v-1h1a1 1 0 00.78-.375l.805-1.086A.5.5 0 008.5 8H9V5a4 4 0 00-4-4zm0 2a2 2 0 00-2 2v1h4V5a2 2 0 00-2-2z" clipRule="evenodd" />
    </svg>,
    // Fire - Red-Orange
    <svg key="fire" className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>,
    // Gear - Gray
    <svg key="gear" className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>,
    // Trophy - Gold
    <svg key="trophy" className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>,
    // Crystal ball - Cyan
    <svg key="crystal" className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>,
    // Palette - Indigo
    <svg key="palette" className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>,
    // Lightning bolt (repeat) - Blue
    <svg key="lightning2" className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>,
    // Light bulb (repeat) - Yellow
    <svg key="bulb2" className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1-1H3a1 1 0 110 2h1a1 1 0 01-1-1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
    </svg>,
    // Target (repeat) - Green
    <svg key="target2" className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>,
    // Rocket (repeat) - Purple
    <svg key="rocket2" className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" />
    </svg>,
    // Star (repeat) - Orange
    <svg key="star2" className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ];
  return icons[index % icons.length];
};

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [localIsAuthenticated, setLocalIsAuthenticated] = useState(false);
  const [localUser, setLocalUser] = useState(null);
  
  // Debug authentication state
  useEffect(() => {
    console.log('🔍 Auth State Debug:', {
      contextUser: user?.email,
      contextIsAuth: isAuthenticated,
      localUser: localUser?.email,
      localIsAuth: localIsAuthenticated,
      hasToken: !!localStorage.getItem('authToken'),
      hasUser: !!localStorage.getItem('user')
    });
  }, [user, isAuthenticated, localUser, localIsAuthenticated]);
  const [slides, setSlides] = useState<SlideCardType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSlides, setRegeneratingSlides] = useState<Set<string>>(new Set());
  const [selectedTheme, setSelectedTheme] = useState<ThemeTemplate>(getDefaultTheme());
  const [isDownloading, setIsDownloading] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState('');
  const [showElements, setShowElements] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedThemeKey, setSelectedThemeKey] = useState('clean-white');
  const [amountOfText, setAmountOfText] = useState('Detailed');
  const [slideCount, setSlideCount] = useState(5);
  const [imageSource, setImageSource] = useState('None');
  const [imageStyle, setImageStyle] = useState('');
  const [outline, setOutline] = useState<OutlineItem[]>([]); // Start empty
  
  // Track if slides have been reordered to prevent regeneration
  const [slidesReordered, setSlidesReordered] = useState(false);
  const [backupOutline, setBackupOutline] = useState<any[]>([]);
  const [backupImages, setBackupImages] = useState<{[key: string]: string}>({});
  const [deletedSlides, setDeletedSlides] = useState<Array<{slide: any, index: number}>>([]);
  const [canUndo, setCanUndo] = useState(false);
  
  // Check local authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setLocalIsAuthenticated(true);
        setLocalUser(parsedUser);
        console.log('✅ Local auth restored:', parsedUser.email);
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        // Clear invalid data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      console.log('🔒 No stored auth data found');
    }
  }, []);
  
  // Load presentation function
  const loadPresentation = (presentation: any) => {
    console.log('🔄 Loading presentation:', presentation);
    console.log('🔄 Presentation data structure:', {
      id: presentation.id,
      title: presentation.title,
      theme_id: presentation.theme_id,
      slides: presentation.slides,
      slidesLength: presentation.slides?.length || 0,
      outline: presentation.outline,
      outlineLength: presentation.outline?.length || 0
    });
    
    console.log('🎯 Current step before loading:', currentStep);
    
    // Set the current presentation ID
    setCurrentPresentationId(presentation.id);
    
    // Load the title
    if (presentation.title) {
      setFinalTitle(presentation.title);
      setPresentationTitle(presentation.title);
    }
    
    // Load the theme
    if (presentation.theme_id) {
      setSelectedThemeKey(presentation.theme_id);
    }
    
    // Load the slides - this is the key fix
    let transformedSlides: any[] = [];
    if (presentation.slides && presentation.slides.length > 0) {
      // Transform backend slide structure to frontend SlideCard structure
      transformedSlides = presentation.slides.map((slide: any) => ({
        id: slide.id,
        title: slide.title,
        bullets: slide.content?.bullets || slide.bullets || [],
        layout: slide.layout || 'image-left',
        image: slide.content?.image || slide.image,
        elements: slide.content?.elements || slide.elements,
        background: slide.content?.background || slide.background
      }));
      
      setSlides(transformedSlides);
      console.log('📊 Loaded slides:', transformedSlides.length);
      console.log('📊 Transformed slides data:', transformedSlides);
      
      // Always create/update the outline from slides to ensure consistency
      const outlineFromSlides = transformedSlides.map((slide: any) => ({
        title: slide.title,
        bullets: slide.bullets || [],
        layout: slide.layout || 'image-left'
      }));
      setOutline(outlineFromSlides);
      console.log('📋 Created outline from slides:', outlineFromSlides.length);
      console.log('📋 Outline content:', outlineFromSlides);
      console.log('📋 Bullets in outline:', outlineFromSlides.map(item => ({ title: item.title, bullets: item.bullets })));
    }
    
    // Note: We always create outline from slides above, so no need to load separate outline
    
    // Load the generated images
    if (presentation.generatedImages) {
      setGeneratedImages(presentation.generatedImages);
      console.log('🖼️ Loaded images:', Object.keys(presentation.generatedImages).length);
    }
    
    // Load the typing bullets (final content)
    if (presentation.typingBullets) {
      setTypingBullets(presentation.typingBullets);
      console.log('✍️ Loaded typing bullets');
    }
    
    // Load metadata
    if (presentation.metadata) {
      if (presentation.metadata.amountOfText) setAmountOfText(presentation.metadata.amountOfText);
      if (presentation.metadata.imageSource) setImageSource(presentation.metadata.imageSource);
      if (presentation.metadata.imageStyle) setImageStyle(presentation.metadata.imageStyle);
    }
    
    // Set slide count from actual slides data
    if (presentation.slides && presentation.slides.length > 0) {
      setSlideCount(presentation.slides.length);
      console.log('🔢 Set slide count to:', presentation.slides.length);
    }
    
    // Go to the customize page (step 3) to show the outline and allow editing
    console.log('🎯 Setting current step to 3 (customize page)');
    setCurrentStep(3);
    
    // Set loading flag to prevent auto-save during state updates
    setIsGenerating(true);
    
    // Clear loading flag after a short delay to allow state updates to complete
    setTimeout(() => {
      setIsGenerating(false);
      console.log('🔄 Loading complete, auto-save re-enabled');
      
      // Force a re-render and check state
      console.log('🎯 Current step after loading:', currentStep);
      
      // Force outline to slides conversion if needed
      if (transformedSlides && transformedSlides.length > 0) {
        console.log('🔄 Post-loading: Ensuring slides are set...');
        setSlides(transformedSlides);
        
        // Also ensure outline is set
        const finalOutline = transformedSlides.map((slide: any) => ({
          title: slide.title,
          bullets: slide.bullets || [],
          layout: slide.layout || 'image-left'
        }));
        setOutline(finalOutline);
        
        console.log('📋 Final outline set:', finalOutline.length);
        console.log('📊 Final slides set:', transformedSlides.length);
      }
    }, 500);
    
    console.log('✅ Presentation loaded successfully - going to customize page');
  };
  
  // Helper function to get bullets from slide structure
  const getSlideBullets = (slide: any): string[] => {
    if (slide.bullets && slide.bullets.length > 0) {
      return slide.bullets;
    }
    return [];
  };

  // Convert outline to slides (ensures bullets are properly displayed)
  const convertOutlineToSlides = () => {
    console.log('🔄 convertOutlineToSlides called with outline:', outline);
    
    if (outline && outline.length > 0) {
      const slidesFromOutline = outline.map((item, index) => ({
        id: `slide-${index + 1}`,
        title: item.title || `Slide ${index + 1}`,
        bullets: item.bullets || [],
        layout: item.layout || 'image-left',
        image: undefined,
        elements: undefined,
        background: undefined
      }));
      
      console.log('🔄 Converting outline to slides:', slidesFromOutline);
      console.log('📋 Each slide content:', slidesFromOutline.map(s => ({ title: s.title, bullets: s.bullets })));
      setSlides(slidesFromOutline);
      return slidesFromOutline;
    }
    console.log('⚠️ No outline to convert');
    return slides || [];
  };

  // Auto-save function
  const autoSavePresentation = async (force = false) => {
    console.log('🚀 autoSavePresentation called with force:', force);
    console.log('🔐 Auth status:', { isAuthenticated, localIsAuthenticated });
    
    // Only save if authenticated and have content
    if (!isAuthenticated && !localIsAuthenticated) {
      console.log('❌ User not authenticated, skipping save');
      return;
    }
    
          // Create slides from ACTUAL GENERATED CONTENT (typingBullets + generatedImages)
      let slidesToSave = slides;
      
      // Check if we have actual generated content from the generate page
      const hasGeneratedContent = Object.keys(typingBullets).length > 0 || Object.keys(generatedImages).length > 0;
      
      if (hasGeneratedContent && outline && outline.length > 0) {
        console.log('🎯 Creating slides from ACTUAL GENERATED CONTENT...');
        console.log('📝 TypingBullets keys:', Object.keys(typingBullets));
        console.log('🖼️ GeneratedImages keys:', Object.keys(generatedImages));
        
        slidesToSave = outline.map((item, index) => {
          // Extract bullets from typingBullets for this slide
          const slideBullets = [];
          let bulletIndex = 0;
          
          // Get all bullets for this slide (index-0, index-1, index-2, etc.)
          while (typingBullets[`${index}-${bulletIndex}`]) {
            const bulletContent = typingBullets[`${index}-${bulletIndex}`];
            if (bulletContent && bulletContent.trim() !== '') {
              slideBullets.push(bulletContent);
            }
            bulletIndex++;
          }
          
          // If no bullets from typingBullets, fall back to outline bullets
          if (slideBullets.length === 0 && item.bullets && item.bullets.length > 0) {
            slideBullets.push(...item.bullets.filter(bullet => bullet && bullet.trim() !== ''));
          }
          
          // If still no bullets, provide defaults
          if (slideBullets.length === 0) {
            slideBullets.push(
              `Key point for ${item.title || `Slide ${index + 1}`}`,
              'Add more content here',
              'Make your presentation engaging'
            );
            console.log(`⚠️ Slide ${index + 1} had no bullets, using defaults:`, slideBullets);
          }
          
          // Get image for this slide
          const slideImage = generatedImages[index.toString()];
          
          return {
            id: `slide-${index + 1}`,
            title: item.title || `Slide ${index + 1}`,
            bullets: slideBullets,
            layout: item.layout || 'image-left',
            image: slideImage ? { url: slideImage, alt: item.title, source: 'ideogram' } : undefined,
            elements: undefined,
            background: undefined
          };
        });
        
        console.log('🎯 Slides created from generated content:', slidesToSave);
        console.log('📊 Content summary:', {
          totalSlides: slidesToSave.length,
          slidesWithBullets: slidesToSave.filter(s => s.bullets && s.bullets.length > 0).length,
          slidesWithImages: slidesToSave.filter(s => s.image).length,
          totalBullets: slidesToSave.reduce((sum, s) => sum + (s.bullets?.length || 0), 0)
        });
        
      } else if (outline && outline.length > 0) {
        // Fallback to outline if no generated content
        console.log('🔄 Creating slides from outline (no generated content available)...');
        slidesToSave = outline.map((item, index) => ({
          id: `slide-${index + 1}`,
          title: item.title || `Slide ${index + 1}`,
          bullets: item.bullets || [],
          layout: item.layout || 'image-left',
          image: undefined,
          elements: undefined,
          background: undefined
        }));
        console.log('🔄 Slides created from outline:', slidesToSave);
      } else if (slides && slides.length > 0) {
        // Fallback to existing slides
        slidesToSave = slides;
        console.log('🔄 Using existing slides:', slidesToSave);
      } else {
        console.log('⚠️ No generated content, outline, or slides available, cannot save');
        return;
      }
      
      console.log('🔄 Final slides prepared for saving:', slidesToSave);
      
      // Save ALL slides directly to Supabase (no filtering)
      console.log('📊 Content check:', {
        slidesLength: slidesToSave?.length || 0,
        outlineLength: outline?.length || 0,
        finalTitle: finalTitle,
        presentationTitle: presentationTitle,
        hasContent: (slidesToSave && slidesToSave.length > 0) || (finalTitle && finalTitle.trim())
      });
      
      if (!slidesToSave || slidesToSave.length === 0) {
        console.log('⚠️ No slides to save, skipping');
        return;
      }
    
    // Don't save too frequently (every 2 minutes unless forced)
    const now = new Date();
    if (!force && lastSaved && (now.getTime() - lastSaved.getTime()) < 120000) return;
    
    setIsSaving(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const token = localStorage.getItem('authToken');
      
      // Note: Slides are now created above from outline, no need to recreate here
      
      // Convert frontend slide format to backend format
      const slidesForBackend = slidesToSave.map((slide, index) => {
        // Get bullets from the outline (which has the current edited content)
        const outlineItem = outline[index];
        const currentBullets = outlineItem?.bullets || [];
        
        // Handle both old format (with bullets) and new format (with content)
        let bullets = [];
        if (currentBullets && currentBullets.length > 0) {
          // Use the current bullets from outline (most up-to-date)
          bullets = currentBullets.filter(bullet => bullet && bullet.trim() !== '');
        } else if (slide.bullets) {
          bullets = slide.bullets;
        }
        
        // If no bullets after filtering, provide default content
        if (bullets.length === 0) {
          bullets = [
            `Key point for ${slide.title || `Slide ${index + 1}`}`,
            'Add more content here',
            'Make your presentation engaging'
          ];
          console.log(`⚠️ Slide ${index + 1} had no bullets, using defaults:`, bullets);
        }
        
        console.log(`📝 Slide ${index + 1} bullets:`, {
          title: slide.title,
          outlineBullets: outlineItem?.bullets,
          slideBullets: slide.bullets,
          finalBullets: bullets
        });
        
        return {
          id: slide.id,
          title: slide.title,
          content: {
            bullets: bullets,
            custom_styling: slide.custom_styling || slide.content?.custom_styling || {},
            theme_info: slide.theme_info || slide.content?.theme_info || {}
          },
          layout: slide.layout || 'image-left',
          slide_order: index
        };
      });
      
      console.log('🔄 Converted slides for backend:', slidesForBackend);
      
      // Always use slidesForBackend instead of slidesToSave for the presentation data
      console.log('💾 Using slidesForBackend for presentation data:', slidesForBackend);
      
      // Validate that we have slides to save
      if (!slidesForBackend || slidesForBackend.length === 0) {
        console.error('❌ No slides data to save!', {
          slides: slides,
          outline: outline,
          slidesToSave: slidesToSave,
          slidesForBackend: slidesForBackend
        });
        return; // Don't save if we have no data
      }
      
      // Debug: Check what we're actually saving
      console.log('💾 Final slides data to save:', {
        slidesToSave,
        slidesToSaveLength: slidesToSave?.length || 0,
        originalSlides: slides,
        originalSlidesLength: slides?.length || 0,
        outline: outline,
        outlineLength: outline?.length || 0
      });
      
      // Always use slidesForBackend (which includes proper backend format)
      const presentationData = {
        title: finalTitle || presentationTitle || 'Untitled Presentation',
        description: finalTitle || presentationTitle || 'Untitled Presentation',
        themeId: null, // We'll need to create/update themes table
        amountOfText: amountOfText || 'detailed',
        imageSource: imageSource || 'ai',
        imageStyle: imageStyle || '',
        slideCount: slidesForBackend.length,
        slides: slidesForBackend, // This now contains the proper backend format
        metadata: {
          amountOfText,
          slideCount,
          imageSource,
          imageStyle,
          outline: outline,
          generatedImages: generatedImages, // Save the actual image URLs
          typingBullets: typingBullets   // Save the final typed content
        }
      };
      
      console.log('💾 Final presentation data being sent:', {
        title: presentationData.title,
        themeId: presentationData.themeId,
        slidesCount: slidesForBackend.length,
        slidesData: slidesForBackend,
        outlineCount: outline.length
      });
      
      console.log('💾 Auto-saving presentation data (using POST):', {
        title: presentationData.title,
        themeId: presentationData.themeId,
        slidesCount: slidesForBackend.length, // Use slidesForBackend instead of slidesToSave
        outlineCount: outline.length,
        hasImages: Object.keys(generatedImages).length > 0,
        hasTypingBullets: Object.keys(typingBullets).length > 0,
        method: 'POST (creating new presentation)'
      });
      
      // Log the actual slides data being sent
      console.log('📊 Slides data structure being sent:', slidesForBackend.map(slide => ({
        id: slide.id,
        title: slide.title,
        content: slide.content,
        layout: slide.layout,
        slide_order: slide.slide_order
      })));
      
      // Log the exact data being sent to backend
      console.log('🚀 EXACT DATA BEING SENT TO BACKEND:', {
        title: presentationData.title,
        slides: presentationData.slides,
        slidesCount: presentationData.slides.length,
        firstSlide: presentationData.slides[0]
      });
      
      // Debug: Log the actual data being sent
      console.log('📊 Full presentation data being sent:', JSON.stringify(presentationData, null, 2));
      console.log('🔍 Current state values:', {
        slides: slides,
        outline: outline,
        finalTitle: finalTitle,
        presentationTitle: presentationTitle
      });
      
      // Debug: Check if slides array is actually populated
      console.log('🎯 Slides array details:', {
        slidesType: typeof slides,
        slidesLength: slides?.length || 0,
        slidesContent: slides,
        isArray: Array.isArray(slides),
        outlineType: typeof outline,
        outlineLength: outline?.length || 0,
        outlineContent: outline,
        isOutlineArray: Array.isArray(outline)
      });
      
      // Debug: Check what's actually being sent to backend
      console.log('🚀 Backend request details:', {
        url: `${API_BASE_URL}/presentations`,
        method: 'POST',
        hasToken: !!token,
        tokenLength: token?.length || 0
      });
      
      // Log the exact request being sent
      console.log('📤 Sending request to backend:', {
        url: `${API_BASE_URL}/presentations`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: presentationData
      });
      
      // Use PUT to update existing presentation, POST only for new ones
      let response;
      if (currentPresentationId) {
        // Update existing presentation
        response = await fetch(`${API_BASE_URL}/presentations/${currentPresentationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(presentationData)
        });
        console.log('🔄 Updating existing presentation:', currentPresentationId);
      } else {
        // Create new presentation
        response = await fetch(`${API_BASE_URL}/presentations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(presentationData)
        });
        console.log('🆔 Creating new presentation');
      }
      
      if (response.ok) {
        if (currentPresentationId) {
          console.log('✅ Presentation updated successfully');
        } else {
          const data = await response.json();
          // Update the current presentation ID for future saves
          setCurrentPresentationId(data.presentation.id);
          console.log('🆔 New presentation created with ID:', data.presentation.id);
        }
      }
      
      if (response.ok) {
        setLastSaved(now);
        console.log('💾 Presentation auto-saved successfully');
        
        // Log the response data to see what was actually saved
        try {
          const responseData = await response.json();
          console.log('✅ Backend response data:', responseData);
        } catch (e) {
          console.log('📝 Response was successful but no JSON data returned');
        }
      } else {
        console.warn('⚠️ Auto-save failed:', response.status);
        
        // Log the error response
        try {
          const errorData = await response.text();
          console.error('❌ Error response:', errorData);
        } catch (e) {
          console.error('❌ Failed to read error response');
        }
      }
    } catch (error) {
      console.error('❌ Auto-save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Debug outline changes to see what's causing resets
  useEffect(() => {
    console.log('🔍 Outline state changed:', {
      length: outline.length,
      content: outline,
      step: currentStep
    });
    
    // If we're on step 3 and have outline content, ensure slides are also set
    if (currentStep === 3 && outline.length > 0 && slides.length === 0) {
      console.log('🔄 On step 3 with outline but no slides, converting...');
      convertOutlineToSlides();
    }
    
      // Ensure slides are populated when on customize page (step 3)
  if (currentStep === 3 && outline.length > 0 && slides.length === 0) {
    console.log('🔄 On customize page with outline but no slides, converting...');
    convertOutlineToSlides();
  }
  
  // Also ensure slides are populated when outline changes on customize page
  if (currentStep === 3 && outline.length > 0) {
    const hasBullets = outline.some(item => item.bullets && item.bullets.length > 0);
    if (hasBullets && slides.length === 0) {
      console.log('🔄 Outline has bullets but no slides, converting...');
      convertOutlineToSlides();
    }
  }
  
  // Force conversion when on customize page
  if (currentStep === 3 && outline.length > 0) {
    console.log('🔄 On customize page, checking if conversion needed...');
    console.log('📊 Current state - Outline:', outline.length, 'Slides:', slides.length);
    console.log('📋 Outline content:', outline.map(item => ({ title: item.title, bullets: item.bullets })));
    
    if (slides.length === 0) {
      console.log('🔄 No slides found, forcing conversion...');
      setTimeout(() => convertOutlineToSlides(), 100);
    }
  }
  }, [outline, currentStep]); // Log whenever outline or step changes
  


  // Auto-expand textareas when outline changes
  useEffect(() => {
    if (outline.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea[placeholder="Enter bullet point..."]');
        textareas.forEach((textarea) => {
          const element = textarea as HTMLTextAreaElement;
          element.style.height = 'auto';
          element.style.height = element.scrollHeight + 'px';
        });
      }, 100);
    }
  }, [outline]);
  const [finalTitle, setFinalTitle] = useState('');
  const [generationStatus, setGenerationStatus] = useState('idle'); // idle | loading | success | error
  const [generateInput, setGenerateInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingProgress, setTypingProgress] = useState({ sectionIndex: 0, bulletIndex: 0 });
  const [typingBullets, setTypingBullets] = useState<{[key: string]: string}>({});
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  
  // Debug generatedImages state changes
  useEffect(() => {
    console.log('🔄 generatedImages state changed:', generatedImages);
    console.log('📊 Number of images in state:', Object.keys(generatedImages).length);
  }, [generatedImages]);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const themeDropdownRef = useRef(null);
  const menuDropdownRef = useRef(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [imageRegenerateModalOpen, setImageRegenerateModalOpen] = useState(false);
  const [regeneratingImageIndex, setRegeneratingImageIndex] = useState<number | null>(null);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [centerSlideIndex, setCenterSlideIndex] = useState<number>(0);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);
  
  // Profile icon state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [recentPresentationsOpen, setRecentPresentationsOpen] = useState(false);
  
  // Auto-save state
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Presentation mode state
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
    // Conservative auto-save system - only save on significant changes
  useEffect(() => {
    // Only auto-save on customize page (step 3)
    if (currentStep !== 3) {
      return;
    }

    // Don't auto-save if we're currently generating/loading
    if (isGenerating) {
      return;
    }

    // Don't auto-save if we're just loading a presentation
    if (currentPresentationId && !isTyping && !slidesReordered) {
      return;
    }

    // Only auto-save if we have ANY content (including test content)
    const hasContent = (slides.length > 0 && slides.some(slide => 
      slide.bullets && slide.bullets.length > 0
    )) || (outline.length > 0 && outline.some(item => 
      item.bullets && item.bullets.length > 0
    )) || (finalTitle && finalTitle.trim().length > 0);

    if (!hasContent) {
      return;
    }

    // Only save on significant changes, not every keystroke
    const timeoutId = setTimeout(() => {
      if (currentStep === 3 && hasContent && !isGenerating) {
        console.log('🔄 Significant content change detected, auto-saving...');
        autoSavePresentation();
      }
    }, 10000); // Save 10 seconds after content changes (much longer delay)

    return () => clearTimeout(timeoutId);
  }, [currentStep, slides, outline, finalTitle, isTyping, slidesReordered, isGenerating]);

  // Manual save trigger - only when user explicitly makes changes
  useEffect(() => {
    if (currentStep === 3 && isTyping) {
      // Only save when user stops typing for a while
      const timeoutId = setTimeout(() => {
        if (currentStep === 3 && !isTyping && !isGenerating) {
          console.log('🔄 User stopped typing, auto-saving...');
          autoSavePresentation();
        }
      }, 15000); // Save 15 seconds after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentStep, isTyping, isGenerating]);

  // Cursor position preservation for contentEditable
  const [cursorPositions, setCursorPositions] = useState<{ [key: string]: number }>({});

  // Controlled contentEditable component to fix cursor jumping
  const ControlledContentEditable = ({ 
    value, 
    onChange, 
    className, 
    style, 
    elementId 
  }: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    style?: React.CSSProperties;
    elementId: string;
  }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Only update DOM when value prop changes, not on every keystroke
    useEffect(() => {
      if (ref.current && ref.current.innerText !== value) {
        ref.current.innerText = value;
      }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const newValue = e.currentTarget.innerText;
      onChange(newValue);
    };

    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className={className}
        style={style}
      />
    );
  };

  const preserveCursorPosition = (elementId: string, element: HTMLElement) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      setCursorPositions(prev => ({ ...prev, [elementId]: startOffset }));
    }
  };

  const restoreCursorPosition = (elementId: string, element: HTMLElement) => {
    const savedPosition = cursorPositions[elementId];
    if (savedPosition !== undefined && element.firstChild) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart(element.firstChild, Math.min(savedPosition, element.firstChild.textContent?.length || 0));
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };
  
  // Force reset regenerating state on component mount
  useEffect(() => {
    setRegeneratingImageIndex(null);
  }, []);
  
  // Debug regenerating state
  useEffect(() => {
    console.log('RegeneratingImageIndex changed:', regeneratingImageIndex);
  }, [regeneratingImageIndex]);

  // Helper function to check if all content is ready
  const isAllContentReady = () => {
    // Check if outline has content
    if (outline.length === 0) return false;
    
    // Check if all slides have titles and bullets
    const hasAllContent = outline.every(slide => 
      slide.title && slide.title.trim() !== '' && 
      slide.bullets && slide.bullets.length > 0 && 
      slide.bullets.every((bullet: any) => bullet && bullet.trim() !== '')
    );
    
    // Check if all images are generated (if image source is not 'None')
    const hasAllImages = imageSource === 'None' || 
      (outline.length > 0 && 
       outline.every((_, index) => generatedImages[index.toString()]));
    
    return hasAllContent && hasAllImages;
  };

  // Presentation mode handlers
  const handlePresentClick = () => {
    if (outline.length === 0) {
      alert('No slides to present. Please generate slides first.');
      return;
    }
    setIsPresenting(true);
    setCurrentSlideIndex(0);
  };

  const handleExitPresentation = () => {
    setIsPresenting(false);
    setCurrentSlideIndex(0);
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < outline.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isPresenting) return;
    
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        handleNextSlide();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        handlePrevSlide();
        break;
      case 'Escape':
        event.preventDefault();
        handleExitPresentation();
        break;
      case 'Home':
        event.preventDefault();
        setCurrentSlideIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setCurrentSlideIndex(outline.length - 1);
        break;
    }
  }, [isPresenting, currentSlideIndex, outline.length]);

  // Add keyboard event listener
  useEffect(() => {
    if (isPresenting) {
      document.addEventListener('keydown', handleKeyPress);
      
      // Hide browser UI for full-screen experience
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      };
    }
  }, [isPresenting, handleKeyPress]);
  
  // Add global reset function for debugging
  useEffect(() => {
    (window as any).resetImageGeneration = () => {
      setRegeneratingImageIndex(null);
      setImageRegenerateModalOpen(false);
      setCustomImagePrompt('');
      setIsGeneratingImage(false);
      console.log('Image generation state reset manually');
    };
    
    // Add test function for image URLs
    (window as any).testImageUrl = (url: string) => {
      console.log('Testing image URL:', url);
      fetch(url)
        .then(response => {
          console.log('Image URL test result:', response.status, response.ok);
        })
        .catch(error => {
          console.error('Image URL test error:', error);
        });
    };
    
    // Add force reset function
    (window as any).forceReset = () => {
      console.log('Force reset triggered');
      setRegeneratingImageIndex(null);
      setImageRegenerateModalOpen(false);
      setCustomImagePrompt('');
      setIsGeneratingImage(false);
      setGeneratedImages({});
    };
  }, []);

  // Function to detect which slide is in the center of the viewport
  const detectCenterSlide = useCallback(() => {
    const slideElements = document.querySelectorAll('[data-slide-index]');
    const viewportCenter = window.innerHeight / 2;
    
    let closestSlide = 0;
    let minDistance = Infinity;
    
    slideElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestSlide = parseInt(element.getAttribute('data-slide-index') || '0');
      }
    });
    
    setCenterSlideIndex(closestSlide);
  }, []);

  // Add scroll listener to detect center slide
  useEffect(() => {
    const handleScroll = () => {
      detectCenterSlide();
    };

    const slideContainer = document.querySelector('.slide-container');
    if (slideContainer) {
      slideContainer.addEventListener('scroll', handleScroll);
      return () => slideContainer.removeEventListener('scroll', handleScroll);
    }
  }, [detectCenterSlide]);

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, index: number) => {
    console.log('Drag started for slide', index);
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedSlideIndex !== null && draggedSlideIndex !== dropIndex) {
      console.log('🎯 Drag and drop: Reordering slides from', draggedSlideIndex, 'to', dropIndex);
      console.log('📋 Stack trace:', new Error().stack);
      
      const newOutline = [...outline];
      const draggedSlide = newOutline[draggedSlideIndex];
      
      // Remove the dragged slide from its original position
      newOutline.splice(draggedSlideIndex, 1);
      
      // Insert it at the new position
      newOutline.splice(dropIndex, 0, draggedSlide);
      
      console.log('Before reorder:', outline.map((slide, idx) => `${idx}: ${slide.title}`));
      setOutline(newOutline);
      setBackupOutline(newOutline); // Save backup of reordered outline
      console.log('After reorder:', newOutline.map((slide, idx) => `${idx}: ${slide.title}`));
      setSlidesReordered(true); // Mark that slides have been reordered
      
      // Reorder generated images to match the new slide order
      console.log('🖼️ Before reorder - Images:', Object.keys(generatedImages));
      
      const newGeneratedImages: {[key: string]: string} = {};
      
      // Simple approach: just move the dragged image to the new position
      // and shift other images accordingly
      Object.keys(generatedImages).forEach(oldIndexStr => {
        const oldIndex = parseInt(oldIndexStr);
        let newIndex = oldIndex;
        
        if (oldIndex === draggedSlideIndex) {
          // The dragged slide moves to dropIndex
          newIndex = dropIndex;
        } else if (draggedSlideIndex < dropIndex) {
          // Dragging forward: shift slides between dragged and drop
          if (oldIndex > draggedSlideIndex && oldIndex <= dropIndex) {
            newIndex = oldIndex - 1;
          }
        } else {
          // Dragging backward: shift slides between drop and dragged
          if (oldIndex >= dropIndex && oldIndex < draggedSlideIndex) {
            newIndex = oldIndex + 1;
          }
        }
        
        newGeneratedImages[newIndex.toString()] = generatedImages[oldIndexStr];
      });
      
      console.log('🖼️ After reorder - Images:', Object.keys(newGeneratedImages));
      
      setGeneratedImages(newGeneratedImages);
      setBackupImages(newGeneratedImages); // Save backup of reordered images
      
      // Update selected slide index if it was affected
      if (selectedSlideId !== null) {
        if (selectedSlideId === draggedSlideIndex) {
          setSelectedSlideId(dropIndex);
        } else if (selectedSlideId > draggedSlideIndex && selectedSlideId <= dropIndex) {
          setSelectedSlideId(selectedSlideId - 1);
        } else if (selectedSlideId < draggedSlideIndex && selectedSlideId >= dropIndex) {
          setSelectedSlideId(selectedSlideId + 1);
        }
      }
      
      console.log('Drag and drop: Slides reordered successfully');
      
      // Force a re-render to ensure the UI updates
      setTimeout(() => {
        console.log('Current outline after reorder:', outline);
      }, 100);
    }
    setDraggedSlideIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlideIndex(null);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setThemeDropdownOpen(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setMenuDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const BACKEND_URL = "http://localhost:3002";

  // Start typing animation when outline is loaded - with persistence
  const typingInitializedRef = React.useRef(false);
  
  React.useEffect(() => {
    if (outline.length > 0 && !isGenerating && isTyping && !typingInitializedRef.current) {
      // Start typing animation for the first bullet of the first section
      setTypingProgress({ sectionIndex: 0, bulletIndex: 0 });
      // Initialize typing bullets with empty strings for all bullets
      const initialTypingBullets: {[key: string]: string} = {};
      outline.forEach((section, sectionIdx) => {
        section.bullets.forEach((bullet, bulletIdx) => {
          const key = `${sectionIdx}-${bulletIdx}`;
          initialTypingBullets[key] = ''; // Start with empty string
        });
      });
      setTypingBullets(initialTypingBullets);
      typingInitializedRef.current = true;
    }
  }, [outline, isGenerating, isTyping]);

  // Ensure content is visible in slides view even if typing hasn't completed
  useEffect(() => {
    if (currentStep === 4 && outline.length > 0) {
      // Mark all content as typed to ensure it's visible
      const completedTypingBullets: {[key: string]: string} = {};
      outline.forEach((section, idx) => {
        section.bullets.forEach((bullet, bulletIdx) => {
          const key = `${idx}-${bulletIdx}`;
          completedTypingBullets[key] = bullet;
        });
      });
      setTypingBullets(completedTypingBullets);
      setIsTyping(false);
      typingInitializedRef.current = true;
    }
  }, [currentStep, outline]);

  // Generate images when entering customize step
  React.useEffect(() => {
    if (currentStep === 3 && outline.length > 0 && imageSource !== 'None' && Object.keys(generatedImages).length === 0 && !slidesReordered) {
      generateImagesForSlides();
    }
  }, [currentStep, imageSource, slidesReordered]); // Removed outline from dependencies

  // Generate new slides based on topic
  const handleGenerateSlides = async (topic: string) => {
    setIsGenerating(true);
    // Reset typing initialization for new content
    typingInitializedRef.current = false;
    try {
      const newSlides = await generateSlides(topic, selectedTheme);
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
  const handleUpdateSlide = (updatedSlide: SlideCardType) => {
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
      const regeneratedSlide = await regenerateSlide(slide.title, selectedTheme);
      
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

  const handleAddElement = (svgPath: string) => {
    // TODO: Insert the element into the selected slide
    console.log('Add element:', svgPath);
  };

  // Select a slide by id
  const handleSelectSlide = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  // Find the selected slide
  const selectedSlide = slides.find(s => s.id === selectedSlideId) || slides[0];

  // Stepper navigation handler
  const handleStepClick = (stepIdx: number) => {
    console.log('🔍 handleStepClick called:', {
      stepIdx,
      currentStep,
      outlineLength: outline.length,
      slidesLength: slides.length
    });
    
    if (stepIdx === 0) {
      setCurrentStep(0);
      return;
    }
    
    // Check authentication for steps beyond landing page
    if (stepIdx > 0 && !isAuthenticated && !localIsAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    
    if (stepIdx <= currentStep) {
      setCurrentStep(stepIdx);
    }
  };

  // Final generation handler
  const handleFinalGenerate = async () => {
    setGenerationStatus('loading');
    try {
      const response = await fetch('http://localhost:3002/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          outline,
          theme: selectedThemeKey,
          amountOfText,
          imageSource,
          imageStyle
        })
      });
      if (!response.ok) throw new Error('Failed to generate slides');
      const data = await response.json();
      setSlides(data.slides || []);
      setGenerationStatus('success');
      setCurrentStep(4); // Go to slides view instead of resetting
      
      // Force save the generated slides
      console.log('💾 Slides generated, forcing save...');
      setTimeout(() => autoSavePresentation(true), 1000); // Save after 1 second
    } catch (err) {
      setGenerationStatus('error');
      alert('Failed to generate slides. Please try again.');
    }
  };

  // When user enters a topic and clicks Next on Generate, set the title and create a default outline
  const handleNextFromGenerate = async () => {
    console.log('🚀 handleNextFromGenerate STARTED');
    const topic = generateInput.trim();
    if (!topic) {
      console.log('❌ No topic provided, returning');
      return;
    }
    
    console.log('🔍 handleNextFromGenerate called with topic:', topic);
    console.log('📋 Stack trace:', new Error().stack);
    
    // Check if user is authenticated
    if (!isAuthenticated && !localIsAuthenticated) {
      // User is not authenticated, show auth modal
      setAuthModalOpen(true);
      return;
    }
    
    // Don't regenerate if slides have been manually reordered
    if (slidesReordered) {
      console.log('⚠️ Skipping regeneration because slides were manually reordered');
      setCurrentStep(2);
      return;
    }
    
    // Additional protection: Don't regenerate if we're not on step 1
    if (currentStep !== 1) {
      console.log('⚠️ Skipping regeneration because we\'re not on step 1 (current step:', currentStep, ')');
      return;
    }
    
    setPresentationTitle(topic);
    setFinalTitle(topic);
    setCurrentStep(2);
    setIsGenerating(true);
    setIsTyping(true);
    setTypingProgress({ sectionIndex: 0, bulletIndex: 0 });
    setTypingBullets({}); // Reset typing bullets
    // Reset typing initialization for new content
    typingInitializedRef.current = false;
    try {
      // Call backend to generate outline and bullets
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      console.log('🌐 Making API call to:', `${API_BASE_URL}/generate`);
      console.log('📤 Request payload:', {
        title: topic,
        outline: [],
        theme: selectedThemeKey,
        amountOfText,
        slideCount,
        imageSource,
        imageStyle
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${API_BASE_URL}/generate?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic,
          outline: [], // Let backend generate outline
          theme: selectedThemeKey,
          amountOfText,
          slideCount,
          imageSource,
          imageStyle
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📥 Response status:', response.status, response.ok);
      if (!response.ok) throw new Error('Failed to generate outline');
      const data = await response.json();
      console.log('📥 Response received successfully');
      // Set outline to generated slides (titles, bullets, and layouts)
      console.log('handleNextFromGenerate: Setting outline from backend data');
      console.log('📊 Raw backend data:', data);
      console.log('📊 data.slides:', data.slides);
      console.log('📊 data.slides length:', data.slides?.length);
      console.log('📊 First slide from backend:', data.slides?.[0]);
      console.log('📊 First slide has image:', !!data.slides?.[0]?.image);
      console.log('📊 First slide image URL:', data.slides?.[0]?.image?.url);
      
      const mappedSlides = (data.slides || []).map(slide => ({ 
        title: slide.title, 
        bullets: slide.bullets,
        layout: slide.layout || 'image-left', // Include layout from server
        image: slide.image // Include image property
      }));
      
      console.log('📊 Mapped slides:', mappedSlides);
      setOutline(mappedSlides);
      console.log('📊 Setting outline with', mappedSlides.length, 'slides');
      setSlidesReordered(false); // Reset reorder flag when new content is generated
      
      // Store generated images if any
      if (data.slides) {
        const images: {[key: string]: string} = {};
        mappedSlides.forEach((slide: any, idx: number) => {
          console.log(`📊 Mapped Slide ${idx} structure:`, slide);
          console.log(`📊 Mapped Slide ${idx} has image:`, !!slide.image);
          console.log(`📊 Mapped Slide ${idx} image URL:`, slide.image?.url);
          
          if (slide.image && slide.image.url) {
            console.log(`📸 Storing image for slide ${idx}:`, slide.image.url);
            images[idx.toString()] = slide.image.url;
          } else {
            console.log(`❌ No image for slide ${idx}`);
          }
        });
        console.log('📸 Setting generatedImages:', images);
        console.log('📊 Number of images found:', Object.keys(images).length);
        setGeneratedImages(images);
      }
    } catch (err) {
      console.error('❌ Error in handleNextFromGenerate:', err);
      setOutline([
        { title: `Introduction to ${topic}`, bullets: ['Welcome to the presentation', 'Overview of key points', 'What you will learn'] },
        { title: `Key Concepts of ${topic}`, bullets: ['Core principles', 'Important definitions', 'Key takeaways'] },
        { title: `Applications of ${topic}`, bullets: ['Real-world examples', 'Practical applications', 'Next steps'] }
      ]);
    } finally {
      console.log('🏁 handleNextFromGenerate: Setting isGenerating to false');
      setIsGenerating(false);
    }
  };

  // Images are now generated directly with slides via Brave Search API
  // No separate image generation needed

  // Image regeneration is no longer needed - images come directly from Brave Search
  const handleRegenerateImageWithPrompt = (idx: number) => {
    // Use existing variables and modal
    setRegeneratingImageIndex(idx);
    setCustomImagePrompt(outline[idx]?.title || '');
    setImageRegenerateModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Get current slide index
    const currentSlideIndex = parseInt(selectedSlideId?.toString() || '0');
    
    try {
      // Show loading state
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        try {
          // Upload to Supabase via backend
          const response = await fetch('http://localhost:3002/api/upload-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
              imageData,
              filename: file.name,
              slideIndex: currentSlideIndex
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to upload image');
          }

          const data = await response.json();
          
          // Update the generatedImages state with the Supabase URL
          setGeneratedImages(prev => ({
            ...prev,
            [currentSlideIndex.toString()]: data.imageUrl
          }));
          
          console.log('Image uploaded to Supabase successfully for slide:', currentSlideIndex);
          console.log('Supabase URL:', data.imageUrl);
          
          // Show success message
          alert('Image uploaded successfully to cloud storage!');
          
        } catch (uploadError) {
          console.error('Error uploading to Supabase:', uploadError);
          alert(`Failed to upload image: ${uploadError.message}`);
        } finally {
          setIsUploadingImage(false);
        }
      };
      
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (regeneratingImageIndex === null || !customImagePrompt.trim()) return;
    
    const currentIndex = regeneratingImageIndex; // Store the current index
    console.log('Starting image regeneration for index:', currentIndex, 'with prompt:', customImagePrompt);
    
    // Set generating state to true
    setIsGeneratingImage(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Timeout triggered for index:', currentIndex);
      if (regeneratingImageIndex === currentIndex) {
        alert('Image generation is taking too long. Please try again.');
        setRegeneratingImageIndex(null);
        setImageRegenerateModalOpen(false);
        setCustomImagePrompt('');
        setIsGeneratingImage(false);
      }
    }, 30000); // 30 second timeout
    
    try {
      // Use only the customImagePrompt, don't combine with imageStyle
      const prompt = customImagePrompt.trim();
      console.log('Sending request with prompt:', prompt);
      
      const requestBody = { 
        prompt, 
        style: '', // Don't use imageStyle for custom regeneration
        slideIndex: currentIndex 
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:3002/api/regenerate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      clearTimeout(timeoutId); // Clear timeout on success
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!data.imageUrl) {
          console.error('No imageUrl in response:', data);
          alert('Invalid response from server - no image URL received');
          setRegeneratingImageIndex(null);
          setImageRegenerateModalOpen(false);
          setCustomImagePrompt('');
          setIsGeneratingImage(false);
          return;
        }
        
        const newImages = { ...generatedImages };
        const imageUrl = data.imageUrl.startsWith('/uploads/')
          ? BACKEND_URL + data.imageUrl
          : data.imageUrl;
        
        console.log('Setting image URL:', imageUrl);
        console.log('Current generatedImages before update:', generatedImages);
        newImages[currentIndex.toString()] = imageUrl;
        setGeneratedImages(newImages);
        
        console.log('Updated generatedImages:', newImages);
        
        // Close modal and reset states IMMEDIATELY
        console.log('Closing modal and resetting states...');
        setRegeneratingImageIndex(null);
        setImageRegenerateModalOpen(false);
        setCustomImagePrompt('');
        setIsGeneratingImage(false);
        console.log('Modal states reset successfully');
        
        // Force a re-render and verify the update
        setTimeout(() => {
          console.log('Current generatedImages after update:', generatedImages);
          console.log('Image should now be available at:', newImages[currentIndex.toString()]);
          
          // Force a re-render by updating the state again
          setGeneratedImages(prev => {
            console.log('Force re-render - previous state:', prev);
            const updated = { ...prev };
            updated[currentIndex.toString()] = imageUrl;
            console.log('Force re-render - updated state:', updated);
            return updated;
          });
          
          // Test if the image URL is accessible
          fetch(imageUrl)
            .then(response => {
              console.log('Image URL test result:', response.status, response.ok);
              if (!response.ok) {
                console.error('Image URL not accessible:', imageUrl);
              } else {
                console.log('✅ Image URL is accessible!');
              }
            })
            .catch(error => {
              console.error('Image URL test error:', error);
            });
        }, 100);
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert(`Failed to regenerate image. Status: ${response.status}. Error: ${errorText}`);
        setRegeneratingImageIndex(null);
        setImageRegenerateModalOpen(false);
        setCustomImagePrompt('');
        setIsGeneratingImage(false);
      }
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('Failed to regenerate image:', error);
      alert('Failed to regenerate image. Network error: ' + error.message);
      setRegeneratingImageIndex(null);
      setImageRegenerateModalOpen(false);
      setCustomImagePrompt('');
      setIsGeneratingImage(false);
    }
  };

  // Batch PNG export
  const handleExportPNGs = async () => {
    try {
      const slideElements = document.querySelectorAll('#slides-preview-container > div');
      if (slideElements.length === 0) {
        alert('No slides to export.');
        return;
      }
      for (let i = 0; i < slideElements.length; i++) {
        const slideElement = slideElements[i] as HTMLElement;
        const dataUrl = await ScreenshotService.captureSlide(slideElement, outline[i]?.title || `Slide ${i+1}`);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}_slide_${i+1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setExportModalOpen(false);
    } catch (error) {
      alert('Failed to export PNGs.');
    }
  };


  const exportEditablePPTX = async (slides, title, theme) => {
    try {
      const pptx = new pptxgen();
      pptx.author = 'NewGamma AI';
      pptx.company = 'NewGamma';
      pptx.title = title;
      pptx.subject = 'AI Generated Presentation';
      pptx.defineLayout({ name: '16x9', width: 13.33, height: 7.5 });
      pptx.layout = '16x9';
      pptx.defineSlideMaster({ title: 'MASTER_SLIDE', objects: ['title', 'body'] });
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        // Set background
        let bgColor = theme?.colors?.background || '#FFFFFF';
        pptxSlide.background = { color: bgColor.replace('#', '') };
        let textColor = theme?.colors?.text || '#000000';
        // Only map Tailwind classes, not already-mapped CSS gradients or colors
        if (typeof theme.style?.background === 'string' && theme.style.background.startsWith('bg-gradient')) {
          let mappedGradient = tailwindToCssGradient(theme.style.background);
          if (mappedGradient && !mappedGradient.startsWith('bg-gradient') && mappedGradient.startsWith('linear-gradient')) {
            theme.style.background = mappedGradient;
          }
        }
        if (typeof theme.style?.background === 'string' && theme.style.background.startsWith('linear-gradient')) {
          // Render gradient to canvas and use as image
          const canvas = document.createElement('canvas');
          canvas.width = 1920;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Parse the gradient direction and stops
            const gradMatch = theme.style.background.match(/linear-gradient\(([^,]+),(.+)\)/);
            if (gradMatch) {
              const direction = gradMatch[1].trim();
              const stops = gradMatch[2].split(',').map(s => s.trim());
              let gradient;
              if (direction === 'to right' || direction === '90deg') {
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
              } else if (direction === '135deg') {
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
              } else {
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
              }
              stops.forEach((stop, i) => {
                // Split color and position
                const parts = stop.split(' ');
                let color = parts[0];
                let pos = parts[1] ? parseFloat(parts[1]) / 100 : i / (stops.length - 1);
                // Only add valid hex or rgb(a) colors
                if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) || color.startsWith('rgb')) {
                  gradient.addColorStop(isNaN(pos) ? i / (stops.length - 1) : pos, color);
                }
              });
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              pptxSlide.background = { path: canvas.toDataURL('image/png') };
            } else {
              pptxSlide.background = { color: bgColor.replace('#', '') };
            }
          } else {
            pptxSlide.background = { color: bgColor.replace('#', '') };
          }
        } else if (typeof theme.style?.background === 'string' && (theme.style.background.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(theme.style.background))) {
          pptxSlide.background = { color: theme.style.background.replace('#', '') };
        } else {
          pptxSlide.background = { color: bgColor.replace('#', '') };
        }
        // Enhanced text colors, fonts, sizes using improved utilities
        const textColors = getContrastingTextColors(theme);
        const fontFamily = getFontFamily(theme, 'heading');
        const bodyFontFamily = getFontFamily(theme, 'body');
        const fontSize = getFontSize(theme, 'heading');
        const bodyFontSize = getFontSize(theme, 'body');
        const textAlignment = getTextAlignment(theme);
        const titleWeight = getFontWeight(theme, 'heading');
        const bodyWeight = getFontWeight(theme, 'body');
        // Layout logic
        const layout = slide.layout || 'image-left';
        let titleBox = { x: 7, y: 0.5, w: 5.5, h: 1 };
        let bulletsBox = { x: 7, y: 2, w: 5.5, h: 5 };
        let imageBox = { x: 0.5, y: 2, w: 5.5, h: 4 };
        let showTitle = true, showBullets = true, showImage = !!(slide.image && slide.image.url);
        let overlayText = false;
        switch (layout) {
          case 'image-left':
            imageBox = { x: 0.5, y: 1, w: 5.5, h: 5.5 }; // Left half, centered with padding
            titleBox = { x: 7, y: 1, w: 5.5, h: 1.2 }; // Right half, top
            bulletsBox = { x: 7, y: 2.5, w: 5.5, h: 4.5 }; // Right half, below title
            break;
          case 'image-right':
            imageBox = { x: 7.33, y: 1, w: 5.5, h: 5.5 }; // Right half, centered with padding
            titleBox = { x: 1, y: 1, w: 5.5, h: 1.2 }; // Left half, top
            bulletsBox = { x: 1, y: 2.5, w: 5.5, h: 4.5 }; // Left half, below title
            break;
          case 'image-top':
            imageBox = { x: 1, y: 0.5, w: 11.33, h: 2 }; // Full width, reduced height
            titleBox = { x: 1, y: 3, w: 11.33, h: 1 };
            bulletsBox = { x: 1, y: 4.2, w: 11.33, h: 2.8 };
            break;
          case 'image-bottom':
            titleBox = { x: 1, y: 0.5, w: 11.33, h: 1 };
            bulletsBox = { x: 1, y: 1.7, w: 11.33, h: 2.5 };
            imageBox = { x: 1, y: 4.5, w: 11.33, h: 2 }; // Full width, reduced height
            break;
          case 'full-image':
            imageBox = { x: 0, y: 0, w: 13.33, h: 7.5 };
            overlayText = true;
            break;
          case 'text-only':
            showImage = false;
            titleBox = { x: 1, y: 1, w: 11.33, h: 1.5 };
            bulletsBox = { x: 1, y: 3, w: 11.33, h: 3.5 };
            break;
          case 'title-only':
            showImage = false;
            showBullets = false;
            titleBox = { x: 0, y: 3, w: 13.33, h: 1.5 };
            break;
          case 'split':
            titleBox = { x: 7, y: 0.5, w: 5.5, h: 1 };
            bulletsBox = { x: 7, y: 2, w: 5.5, h: 5 };
            imageBox = { x: 0.5, y: 1, w: 6, h: 5.5 };
            break;
        }
        if (showTitle && slide.title && !overlayText) {
          // Use HTML content if available, otherwise convert plain text
          const titleData = slide.titleHtml ? extractRichTextFromHtml(slide.titleHtml) : { text: slide.title, options: {} };
          
          // Debug logging
          console.log('🔍 Exporting title for slide:', {
            slideIndex: i,
            title: slide.title,
            titleHtml: slide.titleHtml,
            extractedData: titleData
          });
          
          // Adjust font size based on heading level and layout
          let adjustedFontSize = fontSize;
          if (titleData.options.headingLevel) {
            switch (titleData.options.headingLevel) {
              case 1:
                adjustedFontSize = fontSize + 8;
                break;
              case 2:
                adjustedFontSize = fontSize + 6;
                break;
              case 3:
                adjustedFontSize = fontSize + 4;
                break;
              case 4:
                adjustedFontSize = fontSize + 2;
                break;
              case 5:
                adjustedFontSize = fontSize + 1;
                break;
              case 6:
                adjustedFontSize = fontSize;
                break;
            }
          }
          
          // For text-only layout, use larger font size
          if (layout === 'text-only') {
            adjustedFontSize = fontSize + 4;
          }
          
          // Use custom alignment if available, otherwise use theme alignment
          let finalAlignment = titleData.options.align || textAlignment;
          
          // Normalize alignment values for PowerPoint
          if (finalAlignment === 'text-center' || finalAlignment === 'center' || finalAlignment === 'centered') {
            finalAlignment = 'center';
          } else if (finalAlignment === 'text-right' || finalAlignment === 'right' || finalAlignment === 'right-aligned') {
            finalAlignment = 'right';
          } else if (finalAlignment === 'text-left' || finalAlignment === 'left' || finalAlignment === 'left-aligned') {
            finalAlignment = 'left';
          } else if (finalAlignment === 'text-justify' || finalAlignment === 'justify' || finalAlignment === 'justified') {
            finalAlignment = 'justify';
          } else {
            finalAlignment = 'left'; // Default fallback
          }
          
          pptxSlide.addText(titleData.text, {
            ...titleBox,
            fontSize: adjustedFontSize,
            fontFace: fontFamily,
            bold: titleData.options.bold || titleWeight === 'bold',
            italic: titleData.options.italic,
            underline: titleData.options.underline,
            strike: titleData.options.strike,
            color: normalizeColor(textColors.title),
            align: finalAlignment,
            valign: 'top'
          });
        }
        if (showBullets && slide.bullets && slide.bullets.length > 0 && !overlayText) {
          // Handle text-only layout differently to prevent overlapping
          if (layout === 'text-only') {
            // For text-only layout, add bullets with proper spacing
            slide.bullets.forEach((bullet, index) => {
              const htmlBullet = slide.bulletsHtml && slide.bulletsHtml[index];
              const bulletData = htmlBullet ? extractRichTextFromHtml(htmlBullet) : { text: bullet, options: {} };
              
              // Calculate position for each bullet to prevent overlapping
              const bulletY = bulletsBox.y + (index * 0.8);
              const bulletHeight = 0.7;
              
              // Use custom alignment if available, otherwise use theme alignment
              let finalAlignment = bulletData.options.align || textAlignment;
              
              // Normalize alignment values for PowerPoint
              if (finalAlignment === 'text-center' || finalAlignment === 'center' || finalAlignment === 'centered') {
                finalAlignment = 'center';
              } else if (finalAlignment === 'text-right' || finalAlignment === 'right' || finalAlignment === 'right-aligned') {
                finalAlignment = 'right';
              } else if (finalAlignment === 'text-left' || finalAlignment === 'left' || finalAlignment === 'left-aligned') {
                finalAlignment = 'left';
              } else if (finalAlignment === 'text-justify' || finalAlignment === 'justify' || finalAlignment === 'justified') {
                finalAlignment = 'justify';
              } else {
                finalAlignment = 'left'; // Default fallback
              }
              
              pptxSlide.addText(bulletData.text, {
                x: bulletsBox.x + 0.3, // Add some padding for bullet icon
                y: bulletY,
                w: bulletsBox.w - 0.6,
                h: bulletHeight,
                fontSize: bodyFontSize,
                fontFace: bodyFontFamily,
                bold: bulletData.options.bold || bodyWeight === 'bold',
                italic: bulletData.options.italic,
                underline: bulletData.options.underline,
                strike: bulletData.options.strike,
                color: normalizeColor(textColors.text),
                align: finalAlignment,
                valign: 'top',
                bullet: { type: 'number', startAt: index + 1 }
              });
            });
          } else {
            // For other layouts, use the original approach
          const bulletTexts = slide.bullets.map((bullet, index) => {
            const htmlBullet = slide.bulletsHtml && slide.bulletsHtml[index];
            const bulletData = htmlBullet ? extractRichTextFromHtml(htmlBullet) : { text: bullet, options: {} };
            return bulletData.text;
          }).join('\n');
          
          const firstBulletData = slide.bulletsHtml && slide.bulletsHtml[0] ? 
            extractRichTextFromHtml(slide.bulletsHtml[0]) : { text: slide.bullets[0], options: {} };
          
          // Adjust font size based on heading level
          let adjustedBodyFontSize = bodyFontSize;
          if (firstBulletData.options.headingLevel) {
            switch (firstBulletData.options.headingLevel) {
              case 1:
                adjustedBodyFontSize = bodyFontSize + 6;
                break;
              case 2:
                adjustedBodyFontSize = bodyFontSize + 4;
                break;
              case 3:
                adjustedBodyFontSize = bodyFontSize + 2;
                break;
              case 4:
                adjustedBodyFontSize = bodyFontSize + 1;
                break;
              case 5:
              case 6:
                adjustedBodyFontSize = bodyFontSize;
                break;
            }
          }
          
          let finalAlignment = firstBulletData.options.align || textAlignment;
          
          // Normalize alignment values for PowerPoint
          if (finalAlignment === 'text-center' || finalAlignment === 'center' || finalAlignment === 'centered') {
            finalAlignment = 'center';
          } else if (finalAlignment === 'text-right' || finalAlignment === 'right' || finalAlignment === 'right-aligned') {
            finalAlignment = 'right';
          } else if (finalAlignment === 'text-left' || finalAlignment === 'left' || finalAlignment === 'left-aligned') {
            finalAlignment = 'left';
          } else if (finalAlignment === 'text-justify' || finalAlignment === 'justify' || finalAlignment === 'justified') {
            finalAlignment = 'justify';
          } else {
            finalAlignment = 'left'; // Default fallback
          }
          
          pptxSlide.addText(bulletTexts, {
            ...bulletsBox,
            fontSize: adjustedBodyFontSize,
            fontFace: bodyFontFamily,
            bold: firstBulletData.options.bold || bodyWeight === 'bold',
            italic: firstBulletData.options.italic,
            underline: firstBulletData.options.underline,
            strike: firstBulletData.options.strike,
            color: normalizeColor(textColors.text),
            align: finalAlignment,
            valign: 'top',
            bullet: true
          });
          }
        }
        if (overlayText) {
          let overlayY = 1.5;
          if (slide.title) {
            const titleData = slide.titleHtml ? extractRichTextFromHtml(slide.titleHtml) : { text: slide.title, options: {} };
            
            // Adjust font size based on heading level
            let adjustedFontSize = fontSize + 4;
            if (titleData.options.headingLevel) {
              switch (titleData.options.headingLevel) {
                case 1:
                  adjustedFontSize = fontSize + 12;
                  break;
                case 2:
                  adjustedFontSize = fontSize + 10;
                  break;
                case 3:
                  adjustedFontSize = fontSize + 8;
                  break;
                case 4:
                  adjustedFontSize = fontSize + 6;
                  break;
                case 5:
                  adjustedFontSize = fontSize + 4;
                  break;
                case 6:
                  adjustedFontSize = fontSize + 2;
                  break;
              }
            }
            
            // Use custom alignment if available, otherwise center for overlay
            let finalAlignment = titleData.options.align || 'center';
            
            // Normalize alignment values for PowerPoint
            if (finalAlignment === 'text-center' || finalAlignment === 'center' || finalAlignment === 'centered') {
              finalAlignment = 'center';
            } else if (finalAlignment === 'text-right' || finalAlignment === 'right' || finalAlignment === 'right-aligned') {
              finalAlignment = 'right';
            } else if (finalAlignment === 'text-left' || finalAlignment === 'left' || finalAlignment === 'left-aligned') {
              finalAlignment = 'left';
            } else if (finalAlignment === 'text-justify' || finalAlignment === 'justify' || finalAlignment === 'justified') {
              finalAlignment = 'justify';
            } else {
              finalAlignment = 'center'; // Default to center for overlay
            }
            
            pptxSlide.addText(titleData.text, {
              x: 0.5, y: overlayY, w: 12.33, h: 1.2,
              fontSize: adjustedFontSize,
              fontFace: fontFamily,
              bold: titleData.options.bold || titleWeight === 'bold',
              italic: titleData.options.italic,
              underline: titleData.options.underline,
              strike: titleData.options.strike,
              color: 'FFFFFF',
              align: finalAlignment,
              valign: 'top'
            });
            overlayY += 1.3;
          }
          if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
            const bulletTexts = slide.bullets.map((bullet, index) => {
              const htmlBullet = slide.bulletsHtml && slide.bulletsHtml[index];
              const bulletData = htmlBullet ? extractRichTextFromHtml(htmlBullet) : { text: bullet, options: {} };
              return bulletData.text;
            }).join('\n');
            
            // Use first bullet's formatting as base style
            const firstBulletData = slide.bulletsHtml && slide.bulletsHtml[0] ? 
              extractRichTextFromHtml(slide.bulletsHtml[0]) : { text: slide.bullets[0], options: {} };
            
            // Adjust font size based on heading level
            let adjustedBodyFontSize = bodyFontSize + 2;
            if (firstBulletData.options.headingLevel) {
              switch (firstBulletData.options.headingLevel) {
                case 1:
                  adjustedBodyFontSize = bodyFontSize + 8;
                  break;
                case 2:
                  adjustedBodyFontSize = bodyFontSize + 6;
                  break;
                case 3:
                  adjustedBodyFontSize = bodyFontSize + 4;
                  break;
                case 4:
                  adjustedBodyFontSize = bodyFontSize + 2;
                  break;
                case 5:
                case 6:
                  adjustedBodyFontSize = bodyFontSize;
                  break;
              }
            }
            
            // Use custom alignment if available, otherwise center for overlay
            let finalAlignment = firstBulletData.options.align || 'center';
            
            // Normalize alignment values for PowerPoint
            if (finalAlignment === 'text-center' || finalAlignment === 'center' || finalAlignment === 'centered') {
              finalAlignment = 'center';
            } else if (finalAlignment === 'text-right' || finalAlignment === 'right' || finalAlignment === 'right-aligned') {
              finalAlignment = 'right';
            } else if (finalAlignment === 'text-left' || finalAlignment === 'left' || finalAlignment === 'left-aligned') {
              finalAlignment = 'left';
            } else if (finalAlignment === 'text-justify' || finalAlignment === 'justify' || finalAlignment === 'justified') {
              finalAlignment = 'justify';
            } else {
              finalAlignment = 'center'; // Default to center for overlay
            }
            
            pptxSlide.addText(bulletTexts, {
              x: 1, y: overlayY, w: 11.33, h: 3,
              fontSize: adjustedBodyFontSize,
              fontFace: bodyFontFamily,
              bold: firstBulletData.options.bold || bodyWeight === 'bold',
              italic: firstBulletData.options.italic,
              underline: firstBulletData.options.underline,
              strike: firstBulletData.options.strike,
              color: 'FFFFFF',
              align: finalAlignment,
              valign: 'top',
              bullet: true
            });
          }
        }
        if (showImage && slide.image && slide.image.url) {
          try {
            let imagePath = slide.image.url;
            if (slide.image.url.includes('localhost:3002') || slide.image.url.startsWith('http')) {
              try {
                const response = await fetch(slide.image.url, { mode: 'cors', credentials: 'omit' });
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const blob = await response.blob();
                const dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error('Failed to read image data'));
                  reader.readAsDataURL(blob);
                });
                
                // Apply image effects for export
                const processedImageUrl = await applyImageEffectForExport(dataUrl, selectedThemeKey, layout);
                
                pptxSlide.addImage({ 
                  data: processedImageUrl, 
                  ...imageBox,
                  sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
                });
              } catch (fetchError) {
                pptxSlide.addText('AI Generated Image', { ...imageBox, fontSize: 14, color: '#666666', align: 'center', valign: 'middle', fill: { color: '#F0F0F0' } });
              }
            } else {
                // Apply image effects for local images too
                const processedImageUrl = await applyImageEffectForExport(imagePath, selectedThemeKey, layout);
                
                pptxSlide.addImage({ 
                  data: processedImageUrl, 
                  ...imageBox,
                  sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
                });
            }
          } catch (error) {
            pptxSlide.addText('AI Generated Image', { ...imageBox, fontSize: 14, color: '#666666', align: 'center', valign: 'middle', fill: { color: '#F0F0F0' } });
          }
        }
        if (slide.elements && slide.elements.length > 0) {
          for (const el of slide.elements) {
            try {
              const response = await fetch(el.svg);
              if (!response.ok) continue;
              const svgText = await response.text();
              const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
              const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
              const slideW = 13.33, slideH = 7.5;
              const x = (el.x / 100) * slideW;
              const y = (el.y / 100) * slideH;
              const w = (el.w / 100) * slideW;
              const h = (el.h / 100) * slideH;
              pptxSlide.addImage({ data: dataUrl, x, y, w, h });
            } catch (err) {
              // skip
            }
          }
        }
      }
      await pptx.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}_editable.pptx` });
    } catch (error) {
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getThemeBackground = (theme) => {
    if (!theme) return '#f8fafc';
    if (theme.style?.background) return theme.style.background;
    if (theme.backgroundGradient) return theme.backgroundGradient;
    if (theme.colors?.background) return theme.colors.background;
    return '#f8fafc';
  };

  // Function to get the slide card color for the current theme
  const getSlideCardColor = () => {
    const theme = THEME_PREVIEWS.find(t => t.key === selectedThemeKey);
    if (!theme) return '#ffffff';
    
    // Return the theme's background color (which is the slide card color)
    return theme.style?.background || '#ffffff';
  };

  // Image effect system for dynamic layouts
  const getImageEffect = (themeKey: string, layout: string) => {
    const effects = {
      // Modern themes - Geometric effects
      'modern-blue': {
        transform: 'scale(1.02)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(59, 130, 246, 0.2)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        position: 'relative'
      },
      'modern-dark': {
        transform: 'scale(1.05)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(156, 163, 175, 0.3)',
        border: '2px solid rgba(156, 163, 175, 0.4)',
        position: 'relative'
      },
      'tech-cyber': {
        transform: 'scale(1.08)',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        boxShadow: '0 30px 60px rgba(16, 185, 129, 0.2), inset 0 0 0 1px rgba(16, 185, 129, 0.4)',
        border: '2px solid rgba(16, 185, 129, 0.6)',
        position: 'relative'
      },
      
      // Creative themes - Organic effects
      'creative-pink': {
        transform: 'scale(1.03)',
        borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
        boxShadow: '0 15px 35px rgba(236, 72, 153, 0.2)',
        border: '2px solid rgba(236, 72, 153, 0.3)',
        position: 'relative'
      },
      'warm-orange': {
        transform: 'scale(1.04)',
        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
        boxShadow: '0 20px 40px rgba(251, 146, 60, 0.25)',
        border: '2px solid rgba(251, 146, 60, 0.4)',
        position: 'relative'
      },
      'luxury-gold': {
        transform: 'scale(1.06)',
        borderRadius: '50% 50% 50% 50% / 60% 40% 60% 40%',
        boxShadow: '0 25px 50px rgba(245, 158, 11, 0.3)',
        border: '3px solid rgba(245, 158, 11, 0.5)',
        position: 'relative'
      },
      
      // Professional themes - Subtle effects
      'corporate-blue': {
        transform: 'scale(1.02)',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.15)',
        border: '1px solid rgba(30, 58, 138, 0.2)',
        position: 'relative'
      },
      'business-green': {
        transform: 'scale(1.03)',
        borderRadius: '20px 5px 20px 5px',
        boxShadow: '0 15px 35px rgba(5, 122, 85, 0.2)',
        border: '2px solid rgba(5, 122, 85, 0.3)',
        position: 'relative'
      },
      
      // Minimal themes - Clean effects
      'clean-white': {
        transform: 'scale(1.01)',
        borderRadius: '8px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        position: 'relative'
      },
      'minimalist-black': {
        transform: 'scale(1.01)',
        borderRadius: '4px',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(0, 0, 0, 0.2)',
        position: 'relative'
      }
    };
    
    return effects[themeKey] || effects['clean-white'];
  };

  // Function to apply image effects for export
  const applyImageEffectForExport = async (imageUrl: string, themeKey: string, layout: string) => {
    try {
      console.log('🔍 Applying image effects for export:', { themeKey, layout, imageUrl });
      
      // Create a temporary container to render the slide with effects
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '800px';
      container.style.height = '600px';
      container.style.backgroundColor = '#ffffff';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.padding = '20px';
      document.body.appendChild(container);

      // Create the image wrapper with effects
      const imageWrapper = document.createElement('div');
      imageWrapper.style.width = '300px';
      imageWrapper.style.height = '300px';
      imageWrapper.style.position = 'relative';
      imageWrapper.style.display = 'flex';
      imageWrapper.style.alignItems = 'center';
      imageWrapper.style.justifyContent = 'center';

      // Apply the image effects from getImageEffect
      const effect = getImageEffect(themeKey, layout);
      console.log('🎨 Effect styles:', effect);
      
      // Apply all the CSS styles from the effect
      Object.assign(imageWrapper.style, {
        transform: effect.transform || 'none',
        boxShadow: effect.boxShadow || 'none',
        border: effect.border || 'none',
        borderRadius: effect.borderRadius || '0',
        clipPath: effect.clipPath || 'none',
        position: effect.position || 'relative'
      });

      // Create and load the image
      const img = document.createElement('img');
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = 'inherit';
      img.style.clipPath = 'inherit';
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      console.log('✅ Image loaded successfully:', img.width, 'x', img.height);

      // Add image to wrapper
      imageWrapper.appendChild(img);
      container.appendChild(imageWrapper);

      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the rendered result using html2canvas
      const canvas = await html2canvas(imageWrapper, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'transparent',
        logging: false
      });

      // Clean up
      document.body.removeChild(container);

      const result = canvas.toDataURL('image/png');
      console.log('✅ Image effects applied successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to apply image effect for export:', error);
      return imageUrl; // Return original if effect fails
    }
  };

  // Function to generate a lighter shade of the theme's primary color for page background
  const getThemePageBackground = () => {
    const theme = THEME_PREVIEWS.find(t => t.key === selectedThemeKey);
    if (!theme) return '#f8fafc';
    
    // Special case: Return black for clean-white theme
    if (selectedThemeKey === 'clean-white') {
      return '#000000';
    }
    
    // Special case: Return flamingo color for flamingo theme
    if (selectedThemeKey === 'flamingo') {
      return '#ff7777'; // Coral pink background
    }
    
    // Special case: Return black for minimal-gray theme
    if (selectedThemeKey === 'minimal-gray') {
      return '#000000'; // Black background
    }
    
    // Special case: Return kraft background color for kraft theme
    if (selectedThemeKey === 'kraft') {
      return '#ddd6cc'; // Kraft background
    }
    
    // Special case: Return daktilo background color for daktilo theme
    if (selectedThemeKey === 'daktilo') {
      return '#e7e4e2'; // Daktilo background
    }
    
    // Special case: Return plant shop background color for plant shop theme
    if (selectedThemeKey === 'plant-shop') {
      return '#deeeff'; // Plant shop background
    }
    
    // Get the primary color from the theme's borderColor (which is the primary color)
    let primaryColor = theme.style?.borderColor;
    if (!primaryColor) {
      // Fallback to theme background if no borderColor
      primaryColor = theme.style?.background || '#4c1d95';
    }
    
    // Convert hex to RGB and make it lighter
    const hex = primaryColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Make it 90% lighter (very light shade)
    const lighterR = Math.min(255, r + Math.round((255 - r) * 0.9));
    const lighterG = Math.min(255, g + Math.round((255 - g) * 0.9));
    const lighterB = Math.min(255, b + Math.round((255 - b) * 0.9));
    
    const result = `rgb(${lighterR}, ${lighterG}, ${lighterB})`;
    console.log('🎨 Theme background color:', {
      theme: selectedThemeKey,
      primaryColor,
      result
    });
    return result;
  };

  // Utility: Map Tailwind gradient classes to real CSS gradients
  const tailwindToCssGradient = (tw) => {
    if (!tw) return null;
    // Add mappings for your theme gradients here
    if (tw === 'bg-gradient-to-r from-yellow-50 to-orange-500') {
      return 'linear-gradient(to right, #fef3c7 0%, #fbbf24 100%)';
    }
    if (tw === 'bg-gradient-to-br from-amber-50 via-yellow-100 to-orange-200') {
      return 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fdba74 100%)';
    }
    if (tw === 'bg-gradient-to-br from-pink-50 to-rose-100') {
      return 'linear-gradient(135deg, #fdf2f8 0%, #ffe4e6 100%)';
    }
    if (tw === 'bg-gradient-to-br from-purple-50 to-violet-100') {
      return 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)';
    }
    if (tw === 'bg-gradient-to-br from-green-50 to-emerald-100') {
      return 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)';
    }
    if (tw === 'bg-gradient-to-br from-amber-50 to-yellow-100') {
      return 'linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)';
    }
    if (tw === 'bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900') {
      return 'linear-gradient(135deg, #0f172a 0%, #022c22 50%, #064e3b 100%)';
    }
    if (tw === 'bg-gradient-to-br from-black via-gray-900 to-blue-900') {
      return 'linear-gradient(135deg, #000000 0%, #111827 50%, #1e3a8a 100%)';
    }
    // Add more as needed
    return null;
  };

  // Helper to determine if a theme is dark
  const isDarkTheme = (themeKey) => {
    const darkThemes = [
      'modern-dark',
      'tech-cyber',
    ];
    if (darkThemes.includes(themeKey)) return true;
    const theme = THEME_PREVIEWS.find(t => t.key === themeKey);
    if (!theme) return false;
    const bg = theme.style?.background || '';
    // Check for dark backgrounds
    if (typeof bg === 'string' && (bg.startsWith('#0') || bg.startsWith('#1'))) return true;
    if (typeof bg === 'string' && bg.includes('0a0a0a')) return true;
    if (typeof bg === 'string' && bg.includes('1e293b')) return true;
    if (typeof bg === 'string' && bg.includes('0f172a')) return true;
    return false;
  };

  // Function to calculate optimal aspect ratio based on content size
  const getOptimalAspectRatio = (title, bullets) => {
    const titleLength = title?.length || 0;
    const totalBulletLength = bullets?.reduce((sum, bullet) => sum + (bullet?.length || 0), 0) || 0;
    const totalContentLength = titleLength + totalBulletLength;
    const bulletCount = bullets?.length || 0;
    
    // Base ratio is 16:10 (1.6)
    let aspectRatio = 1.6;
    
    // Adjust based on content length
    if (totalContentLength > 500) {
      aspectRatio = 1.8; // More vertical for lots of content
    } else if (totalContentLength > 300) {
      aspectRatio = 1.7;
    } else if (totalContentLength > 150) {
      aspectRatio = 1.65;
    } else if (totalContentLength < 50) {
      aspectRatio = 1.5; // More horizontal for minimal content
    }
    
    // Adjust based on bullet count
    if (bulletCount > 6) {
      aspectRatio = Math.max(aspectRatio, 1.8);
    } else if (bulletCount > 4) {
      aspectRatio = Math.max(aspectRatio, 1.7);
    }
    
    // Adjust based on title length
    if (titleLength > 100) {
      aspectRatio = Math.max(aspectRatio, 1.7);
    }
    
    return aspectRatio;
  };



  // Function to convert HTML content to exportable text
  const convertHtmlToExportText = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return htmlContent || '';
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Convert HTML to plain text while preserving basic structure
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  };

  // Function to add a new slide
  const handleAddNewSlide = () => {
    const newSlide = {
      title: 'New Slide',
      bullets: ['Add your content here', 'Include key points', 'Make it engaging'],
      layout: 'image-left',
      bulletsHtml: ['<p>Add your content here</p>', '<p>Include key points</p>', '<p>Make it engaging</p>'],
      titleHtml: '<p>New Slide</p>' // Add proper HTML content for Tiptap
    };
    
    const newOutline = [...outline, newSlide];
    setOutline(newOutline);
    
    // Select the new slide
    setSelectedSlideId(newOutline.length - 1);
    
    console.log('Added new slide, total slides:', newOutline.length);
  };

  // Function to undo slide deletion
  const handleUndoDelete = () => {
    if (deletedSlides.length > 0) {
      const lastDeleted = deletedSlides[deletedSlides.length - 1];
      const newOutline = [...outline];
      newOutline.splice(lastDeleted.index, 0, lastDeleted.slide);
      setOutline(newOutline);
      
      // Remove from deleted slides
      setDeletedSlides(prev => prev.slice(0, -1));
      setCanUndo(deletedSlides.length > 1);
    }
  };

  // Function to extract rich text formatting from HTML for PowerPoint export
  const extractRichTextFromHtml = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return { text: htmlContent || '', options: {} };
    
    // Debug logging
    console.log('🔍 Processing HTML content:', htmlContent);
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extract text content
    let text = tempDiv.textContent || tempDiv.innerText || '';
    text = text.replace(/\s+/g, ' ').trim();
    
    // Extract formatting options
    const options = {};
    
    // Check for bold text
    const boldElements = tempDiv.querySelectorAll('strong, b');
    if (boldElements.length > 0) {
      options.bold = true;
    }
    
    // Check for italic text
    const italicElements = tempDiv.querySelectorAll('em, i');
    if (italicElements.length > 0) {
      options.italic = true;
    }
    
    // Check for underlined text
    const underlineElements = tempDiv.querySelectorAll('u');
    if (underlineElements.length > 0) {
      options.underline = true;
    }
    
    // Check for strikethrough text
    const strikeElements = tempDiv.querySelectorAll('s, strike');
    if (strikeElements.length > 0) {
      options.strike = true;
    }
    
    // Check for heading levels (h1, h2, h3, etc.)
    const h1Elements = tempDiv.querySelectorAll('h1');
    const h2Elements = tempDiv.querySelectorAll('h2');
    const h3Elements = tempDiv.querySelectorAll('h3');
    const h4Elements = tempDiv.querySelectorAll('h4');
    const h5Elements = tempDiv.querySelectorAll('h5');
    const h6Elements = tempDiv.querySelectorAll('h6');
    
    if (h1Elements.length > 0) {
      options.headingLevel = 1;
    } else if (h2Elements.length > 0) {
      options.headingLevel = 2;
    } else if (h3Elements.length > 0) {
      options.headingLevel = 3;
    } else if (h4Elements.length > 0) {
      options.headingLevel = 4;
    } else if (h5Elements.length > 0) {
      options.headingLevel = 5;
    } else if (h6Elements.length > 0) {
      options.headingLevel = 6;
    }
    
    // Check for text alignment
    const styleAttribute = tempDiv.getAttribute('style');
    if (styleAttribute) {
      if (styleAttribute.includes('text-align: center')) {
        options.align = 'center';
      } else if (styleAttribute.includes('text-align: right')) {
        options.align = 'right';
      } else if (styleAttribute.includes('text-align: left')) {
        options.align = 'left';
      } else if (styleAttribute.includes('text-align: justify')) {
        options.align = 'justify';
      }
    }
    
    // Check for alignment in child elements
    const centerElements = tempDiv.querySelectorAll('[style*="text-align: center"]');
    const rightElements = tempDiv.querySelectorAll('[style*="text-align: right"]');
    const leftElements = tempDiv.querySelectorAll('[style*="text-align: left"]');
    const justifyElements = tempDiv.querySelectorAll('[style*="text-align: justify"]');
    
    if (centerElements.length > 0) {
      options.align = 'center';
    } else if (rightElements.length > 0) {
      options.align = 'right';
    } else if (leftElements.length > 0) {
      options.align = 'left';
    } else if (justifyElements.length > 0) {
      options.align = 'justify';
    }
    
    console.log('🔍 Extracted options:', { text, options });
    
    return { text, options };
  };

  // Helper function to clean up empty bullets
  const cleanupEmptyBullets = (bullets) => {
    return bullets.filter(bullet => bullet.trim() !== '');
  };

  // Force reset regeneratingImageIndex on component mount
  useEffect(() => {
    setRegeneratingImageIndex(null);
    console.log('Component mounted - reset regeneratingImageIndex');
  }, []);

  // Global reset function for debugging
  useEffect(() => {
    window.resetImageGeneration = () => {
      console.log('Manual reset triggered');
      setRegeneratingImageIndex(null);
      setImageRegenerateModalOpen(false);
      setCustomImagePrompt('');
    };
    
    window.forceReset = () => {
      console.log('Force reset triggered');
      setRegeneratingImageIndex(null);
      setImageRegenerateModalOpen(false);
      setCustomImagePrompt('');
      setGeneratedImages({});
    };
  }, []);

  return (
    <>
      {/* Presentation Mode */}
      {isPresenting && (
        <PresentationView
          slides={outline}
          currentSlideIndex={currentSlideIndex}
          onNextSlide={handleNextSlide}
          onPrevSlide={handlePrevSlide}
          onExitPresentation={handleExitPresentation}
          selectedThemeKey={selectedThemeKey}
          generatedImages={generatedImages}
          THEME_PREVIEWS={THEME_PREVIEWS}
          slideCardColor={getSlideCardColor()}
        />
      )}
      
    <div
      style={{
        minHeight: '100vh',
        background: currentStep === 3 
          ? getThemePageBackground() 
          : `url(${pastelBg}) center center / cover no-repeat fixed`,
      }}
      className="w-full min-h-screen flex flex-col overflow-hidden"
    >
      {/* Stepper at the top (hide in preview/customize step) */}
      {currentStep !== 3 && (
        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowNavigation={true}
        />
      )}



      {/* Step content */}
      <div className={`w-full ${currentStep === 3 ? '' : 'max-w-7xl mx-auto px-4'}`}>
        {currentStep === 0 && (
          <div className="fixed inset-0 w-screen h-screen flex items-center justify-center overflow-hidden">
            {/* Profile Icon - Top Right */}
            <div className="absolute top-6 right-6 z-50">
              {!isAuthenticated && !localIsAuthenticated ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-semibold cursor-pointer hover:scale-105 transition-transform duration-200">
                    {(localUser?.display_name || localUser?.name || user?.display_name || user?.name || 'U')?.charAt(0)?.toUpperCase()}
                  </div>
                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                    >
                      <span className="font-medium text-sm">
                        {localUser?.display_name || localUser?.name || user?.display_name || user?.name || 'User'}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Recent Presentations Button - Top Left */}
            {(isAuthenticated || localIsAuthenticated) && (
              <div className="absolute top-6 right-6 z-50 mt-14">
                <button
                  onClick={() => setRecentPresentationsOpen(true)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-gray-800 text-sm rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/30 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Recent Presentations
                </button>
              </div>
            )}
            
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl"></div>
            </div>
            
            <div className="flex flex-col items-center justify-center w-full relative z-10 px-6">
              {/* Main content */}
              <div className="text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-gray-800 text-sm font-medium mb-8 border border-white/30">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  AI-Powered Presentation Tool
                </div>
                
                {/* Main heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-800 text-center mb-8 leading-tight tracking-tight">
                  Transform Ideas Into
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Stunning Slides
                  </span>
                </h1>
                
                {/* Subheading */}
                <p className="text-xl md:text-2xl text-gray-700 text-center mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                  Create professional presentations in seconds with AI. From concept to slides, 
                  <span className="font-semibold text-gray-800"> everything you need in one place.</span>
                </p>
                
                {/* Input section */}
                <div className="relative w-full max-w-2xl mx-auto mb-12">
                  <div className="relative group">
                    <input
                      type="text"
                      className="w-full rounded-2xl px-8 py-6 text-xl border-2 border-white/30 bg-white/20 backdrop-blur-sm focus:ring-4 focus:ring-white/30 focus:border-white/50 outline-none text-gray-800 placeholder-gray-600 transition-all duration-150 shadow-2xl"
                      placeholder="What's your presentation about?"
                      value={generateInput}
                      onChange={e => setGenerateInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleGenerateSlides(generateInput); }}
                      style={{
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)'
                      }}
                    />
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <button
                    className="group relative px-8 py-5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg transition-all duration-150 transform hover:scale-105 hover:shadow-2xl"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center w-full">
                      <span className="mr-3 text-2xl"></span>🚀 Generate
                    </span>
                  </button>
                </div>
                

              </div>
            </div>
          </div>
        )}
        {currentStep === 1 && (
          <div className="py-12 flex flex-col items-center w-full">
            {/* Profile Icon - Top Right */}
            <div className="absolute top-6 right-6 z-50">
              {!isAuthenticated && !localIsAuthenticated ? (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Sign In</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-semibold cursor-pointer hover:scale-105 transition-transform duration-200">
                    {(localUser?.display_name || localUser?.name || user?.display_name || user?.name || 'U')?.charAt(0)?.toUpperCase()}
                  </div>
                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileModalOpen(true)}
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                    >
                      <span className="font-medium text-sm">
                        {localUser?.display_name || localUser?.name || user?.display_name || user?.name || 'User'}
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-8">Generate</h1>
            
            {/* Recent Presentations Button - Top Left */}
            {(isAuthenticated || localIsAuthenticated) && (
              <div className="absolute top-6 left-6 z-50 mt-4">
                <button
                  onClick={() => setRecentPresentationsOpen(true)}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-gray-800 text-sm rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/30 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Recent Presentations
                </button>
              </div>
            )}
            
            {/* Auto-save Status Indicator */}
            {(isAuthenticated || localIsAuthenticated) && (slides.length > 0 || outline.length > 0) && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-700">Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        Saved {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-sm text-gray-500">Not saved yet</span>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              {/* Prompt input for topic */}
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-gamma-blue"
                placeholder="Describe what you'd like to make"
                value={generateInput}
                onChange={e => setGenerateInput(e.target.value)}
              />
              {/* Amount of text selector */}
              <div className="w-full mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Amount of text</label>
                <div className="flex gap-2 mt-1">
                  {['minimal', 'concise', 'detailed', 'extensive'].map(opt => (
                    <label key={opt} className="flex items-center gap-1 cursor-pointer">
                      <input type="radio" name="content-style" className="accent-gamma-blue" checked={amountOfText === opt} onChange={() => setAmountOfText(opt)} /> <span>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Number of slides selector */}
              <div className="w-full mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Number of slides (max 10)</label>
                <div className="flex items-center gap-4 mt-1">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={slideCount}
                    onChange={(e) => setSlideCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-lg font-semibold text-gray-700 min-w-[2rem] text-center">{slideCount}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>3</span>
                  <span>10</span>
                </div>
              </div>
              {/* Example prompts grid */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button className="bg-blue-50 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition" onClick={() => setGenerateInput('What are Neurons?')}>What are Neurons?</button>
                <button className="bg-blue-50 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition" onClick={() => setGenerateInput('Parts of the Neuron')}>Parts of the Neuron</button>
                <button className="bg-blue-50 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition" onClick={() => setGenerateInput('How do neurons communicate?')}>How do neurons communicate?</button>
                <button className="bg-blue-50 rounded-lg px-4 py-3 text-left hover:bg-blue-100 transition" onClick={() => setGenerateInput('Neurons in the brain')}>Neurons in the brain</button>
              </div>
              <button className="mt-2 px-6 py-2 bg-gamma-blue text-white rounded-lg font-semibold w-full" onClick={handleNextFromGenerate} disabled={!generateInput.trim() || isGenerating}>
                {isGenerating ? 'Generating...' : (!isAuthenticated && !localIsAuthenticated ? 'Sign In to Continue' : 'Next: Outline')}
              </button>
              {!isAuthenticated && !localIsAuthenticated && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Please sign in to generate your presentation
                </p>
              )}
            </div>
          </div>
        )}
        {currentStep === 2 && (
          <div className="py-12 flex flex-col items-center w-full">
            <h1 className="text-3xl font-bold mb-8">Outline</h1>
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              {/* Editable prompt/title */}
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-xl font-semibold mb-8 focus:outline-none focus:ring-2 focus:ring-gamma-blue text-center"
                value={finalTitle}
                onChange={e => setFinalTitle(e.target.value)}
                placeholder="Enter your presentation topic or prompt"
              />
              {/* Numbered editable cards */}
              <div className="w-full mb-8">
                {isGenerating && outline.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gamma-blue"></div>
                      <span className="text-gray-600">Generating outline...</span>
                    </div>
                  </div>
                ) : (
                  <>

                    
                    {outline.map((section, idx) => (
                      <div key={idx} className="flex items-start mb-4 bg-gray-50 rounded-lg p-4 shadow-sm">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gamma-blue text-white font-bold text-lg mr-4 mt-1">{idx+1}</div>
                        <div className="flex-1">
                          <input
                            type="text"
                            className="w-full font-semibold text-lg mb-2 bg-transparent border-b border-gray-200 focus:border-gamma-blue focus:outline-none"
                            value={section.title}
                            onChange={e => {
                              const newOutline = [...outline];
                              newOutline[idx].title = e.target.value;
                              setOutline(newOutline);
                            }}
                          />
                          {/* Directly editable bullet points */}
                          <div className="ml-2 mt-1 text-gray-700 text-base">
                            {section.bullets && section.bullets.map((bullet, bulletIdx) => {
                              const bulletKey = `${idx}-${bulletIdx}`;
                              const isCurrentlyTyping = isTyping && idx === typingProgress.sectionIndex && bulletIdx === typingProgress.bulletIndex;
                              const hasBeenTyped = typingBullets[bulletKey] === bullet;
                              const displayText = isCurrentlyTyping ? (typingBullets[bulletKey] || '') : (hasBeenTyped ? bullet : '');
                              
                              return (
                                <div key={bulletIdx} className="flex items-start mb-1">
                                  <span className="mr-2 mt-1 text-lg">{getBulletIcon(bulletIdx)}</span>
                                  {isCurrentlyTyping ? (
                                    <TypingAnimation
                                      text={bullet}
                                      speed={5}
                                      className="flex-1 bg-transparent border-b border-gray-100 focus:border-gamma-blue focus:outline-none"
                                      onComplete={() => {
                                        // Update the typing bullets with the full text
                                        setTypingBullets(prev => ({
                                          ...prev,
                                          [bulletKey]: bullet
                                        }));
                                        
                                        if (bulletIdx < section.bullets.length - 1) {
                                          setTypingProgress({ sectionIndex: idx, bulletIndex: bulletIdx + 1 });
                                        } else if (idx < outline.length - 1) {
                                          setTypingProgress({ sectionIndex: idx + 1, bulletIndex: 0 });
                                        } else {
                                          setIsTyping(false);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="flex-1 flex items-center">
                                      <div
                                        className="flex-1 bg-transparent border-b border-gray-100 focus:border-gamma-blue focus:outline-none min-h-[1.5rem] w-full"
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        onInput={(e) => {
                                          const newOutline = [...outline];
                                          newOutline[idx].bullets[bulletIdx] = e.currentTarget.textContent || '';
                                          setOutline(newOutline);
                                        }}
                                        onBlur={(e) => {
                                          const newOutline = [...outline];
                                          newOutline[idx].bullets[bulletIdx] = e.currentTarget.textContent || '';
                                          setOutline(newOutline);
                                        }}
                                        style={{
                                          wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                          overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          width: '100%',
                                          boxSizing: 'border-box',
                                          overflow: 'visible',
                                          minHeight: '1.5rem',
                                          outline: 'none',
                                          resize: 'none',
                                        }}
                                      >
                                        {displayText}
                                      </div>
                                      {section.bullets.length > 1 && (
                                        <button
                                          className="ml-2 text-gray-300 hover:text-red-500 text-sm"
                                          onClick={() => {
                                            const newOutline = [...outline];
                                            newOutline[idx].bullets.splice(bulletIdx, 1);
                                            setOutline(newOutline);
                                          }}
                                          title="Remove bullet"
                                        >
                                          ×
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {/* Add new bullet button */}
                            <button
                              className="text-gray-400 hover:text-gamma-blue text-sm mt-1 ml-6"
                              onClick={() => {
                                const newOutline = [...outline];
                                newOutline[idx].bullets.push('');
                                setOutline(newOutline);
                              }}
                            >
                              + Add bullet
                            </button>
                          </div>
                        </div>
                        <div className="ml-4 mt-2 flex flex-col gap-2">
                          <button 
                            className="text-gray-400 hover:text-red-500" 
                            title="Remove card" 
                            onClick={() => {
                          const newOutline = outline.filter((_, i) => i !== idx);
                          setOutline(newOutline);
                            }}
                          >
                            ×
                          </button>
                          <button 
                            className={`text-sm transition-colors ${
                              regeneratingImageIndex === idx 
                                ? 'text-blue-500' 
                                : 'text-gray-400 hover:text-blue-500'
                            }`}
                            title="Regenerate image" 
                            onClick={() => handleRegenerateImageWithPrompt(idx)}
                            disabled={regeneratingImageIndex === idx}
                          >
                            {regeneratingImageIndex === idx ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            ) : (
                              <img src={regenImgIcon} alt="Regenerate" className="w-4 h-4" />
                            )}
                        </button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full mt-2 py-2 bg-blue-50 hover:bg-blue-100 text-gamma-blue rounded-lg font-semibold flex items-center justify-center gap-2" onClick={() => {
                      const newOutline = [...outline, { title: 'New Slide', bullets: ['Add your content here', 'Include key points', 'Make it engaging'] }];
                      setOutline(newOutline);
                      
                      // Generate image for the newly added slide if image source is not 'None'
                      if (imageSource !== 'None') {
                        setTimeout(() => {
                          generateImagesForSlides();
                        }, 100);
                      }
                    }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      Add card
                    </button>
                  </>
                )}
              </div>
              {/* Customize section */}
              <div className="w-full bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-bold mb-4">Customize your presentation</h2>
                {/* Theme preview grid */}
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Themes</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {THEME_PREVIEWS.map(theme => (
                      <button
                        key={theme.key}
                        className={`rounded-xl p-4 shadow flex flex-col items-start border-4 transition-all duration-150 focus:outline-none ${selectedThemeKey === theme.key ? theme.border + ' ring-2 ring-gamma-blue' : 'border-transparent'}`}
                        style={theme.style}
                        onClick={() => setSelectedThemeKey(theme.key)}
                        type="button"
                        tabIndex={0}
                        aria-pressed={selectedThemeKey === theme.key}
                      >
                        <span className={`${theme.titleClass} ${theme.key === 'mocha' ? ' text-[#e7d7c1]' : ''}`}>Title</span>
                        <span className={`${theme.bodyClass} ${theme.key === 'mocha' ? ' text-[#e7d7c1]' : ''}`}>Body & <a href="#" className="underline">link</a></span>
                        <span className="text-xs text-gray-400 mt-2">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Content style radio buttons removed from here */}
                <div className="flex flex-wrap gap-6">
                  {/* Image source dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Image source</label>
                    <select className="rounded-lg border-gray-300 px-3 py-2 text-base" value={imageSource} onChange={e => setImageSource(e.target.value)}>
                      <option value="AI images">AI images</option>
                      <option value="Unsplash">Unsplash</option>
                      <option value="Upload Image">Upload Image</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  {/* Image style input */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Image style</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base" placeholder="Optional: describe the colors, style, or mood to use" value={imageStyle} onChange={e => setImageStyle(e.target.value)} />
                  </div>
                </div>
                
                {/* Upload Image Section */}
                {imageSource === 'Upload Image' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3">Upload Your Own Images</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">
                          Select Image File
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="w-full p-2 border border-blue-300 rounded-lg text-sm"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file);
                            }
                          }}
                        />
              </div>
                      <div className="text-xs text-blue-600">
                        Supported formats: JPG, PNG, GIF, WebP (Max size: 5MB)
                      </div>
            </div>
          </div>
        )}
              </div>
                      <button
                className={`mt-2 px-6 py-2 rounded-lg font-semibold w-full transition-all duration-200 ${
                  isGenerating || isTyping || isGeneratingImages || regeneratingImageIndex !== null || !isAllContentReady()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gamma-blue text-white hover:bg-blue-700'
                }`} 
                onClick={() => setCurrentStep(3)}
                disabled={isGenerating || isTyping || isGeneratingImages || regeneratingImageIndex !== null || !isAllContentReady()}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Content...
                  </span>
                ) : isTyping ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Typing Content...
                  </span>
                ) : isGeneratingImages ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Images...
                  </span>
                ) : regeneratingImageIndex !== null ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Image...
                  </span>
                ) : !isAllContentReady() ? (
                  <span className="flex items-center justify-center">
                    <span className="text-yellow-200 mr-2">⏳</span>
                    Waiting for Content...
                  </span>
                ) : (
                  'Generate'
                )}
                      </button>
                  </div>
              </div>
        )}
        {currentStep === 3 && !isPresenting && (
          <div 
            className="h-screen flex flex-col gap-4 px-0"
          >

            {/* Modern Navbar */}
            <ModernNavbar
              selectedThemeKey={selectedThemeKey}
              onThemeChange={setSelectedThemeKey}
              themes={THEME_PREVIEWS}
              onPresent={handlePresentClick}
              onExport={() => {
                setExportModalOpen(true);
              }}
              onPresentationSelect={(presentation) => {
                console.log('ModernNavbar: Loading presentation:', presentation);
                // Load the selected presentation
                loadPresentation(presentation);
              }}
              className="sticky top-0 z-50"
            />
            
            {/* Auto-save Status for Customize Page */}
            {(isAuthenticated || localIsAuthenticated) && (
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-700">Auto-saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-700">
                        Auto-saved {lastSaved.toLocaleTimeString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-blue-600">Auto-save active</span>
                    </>
                  )}
                  
                  {/* Manual Save Button */}
                  <button
                    onClick={() => {
                      console.log('🔄 Manual save triggered from customize page');
                      autoSavePresentation(true);
                    }}
                    disabled={isSaving}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Now'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-row w-full h-full gap-6 mt-3">
              {/* Sidebar - Slide Preview */}
              <div className="w-48 flex-shrink-0 bg-white border-r border-gray-200 ml-1 max-h-[calc(100vh-120px)] rounded-2xl mt-84 overflow-y-auto scrollbar-hide pb-4">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-medium text-gray-700">Slides</h3>
                    {canUndo && (
                      <button
                        onClick={handleUndoDelete}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-200"
                        title="Undo delete"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 pb-3">
                    {outline.map((section, idx) => (
                      <div key={idx} className="relative group">
                        <button
                        className={`w-full rounded-lg border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-grab active:cursor-grabbing ${
                          selectedSlideId === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                        } ${draggedSlideIndex === idx ? 'opacity-50 scale-95' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, idx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, idx)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setSelectedSlideId(idx);
                          // Scroll to the selected slide
                          const slideElement = document.querySelector(`[data-slide-index="${idx}"]`);
                          if (slideElement) {
                            slideElement.scrollIntoView({ 
                              behavior: 'smooth', 
                              block: 'center' 
                            });
                          }
                        }}
                      >
                        <div className="relative p-2">
                          {/* Slide number badge */}
                          <div className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold z-10">
                            {idx + 1}
                          </div>
                          
                          {/* Complete slide preview */}
                          <div 
                            className="relative w-full h-20 rounded overflow-hidden border border-gray-200"
                            style={{
                              background: THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.style?.background || 
                                         THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.backgroundGradient || 
                                         THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.colors?.background || '#fff',
                              fontFamily: THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.style?.fontFamily || 'inherit',
                            }}
                          >
                            {/* Image preview (left side) */}
                            <div className="absolute left-0 top-0 w-1/2 h-full">
                              {generatedImages[idx.toString()] ? (
                                <img
                                  src={generatedImages[idx.toString()]}
                                  alt={section.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                  No Img
                                </div>
                              )}
                            </div>
                            
                            {/* Text preview (right side) */}
                            <div className="absolute right-0 top-0 w-1/2 h-full p-1">
                              <div className={`text-xs font-bold truncate mb-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}>
                                {section.title || 'Untitled'}
                              </div>
                              <div className={`text-xs truncate ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}>
                                {section.bullets?.[0] || 'No content'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (outline.length > 1) {
                          // Store the deleted slide for undo
                          const deletedSlide = outline[idx];
                          setDeletedSlides(prev => [...prev, { slide: deletedSlide, index: idx }]);
                          setCanUndo(true);
                          
                          const newOutline = outline.filter((_, index) => index !== idx);
                          setOutline(newOutline);
                          if (selectedSlideId === idx) {
                            setSelectedSlideId(Math.max(0, idx - 1));
                          } else if (selectedSlideId > idx) {
                            setSelectedSlideId(selectedSlideId - 1);
                          }
                        }
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center text-xs font-bold shadow-lg"
                      title="Delete slide"
                    >
                      ×
                    </button>
                  </div>
                    ))}
                  
                  {/* Add New Slide Button */}
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <button
                      onClick={handleAddNewSlide}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all duration-200 hover:border-blue-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Slide
                    </button>
                  </div>
                  </div>
                </div>
              </div>

              {/* Main Slide Preview */}
              <div className="flex-1 flex flex-col items-center px-4 pr-16 mt-3">
                {/* Vertical Stack of Slides - Gamma Style */}
                <div className="w-full max-w-5xl space-y-8 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide pb-24 slide-container pt-2">
                  {outline.map((section, idx) => (
                    <div
                      key={idx}
                      data-slide-index={idx}
                      className="w-full rounded-2xl overflow-hidden shadow-lg"
                    style={{
                    background: THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.style?.background || 
                               THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.backgroundGradient || 
                               THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.colors?.background || '#fff',
                      fontFamily: THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.style?.fontFamily || 'inherit',
                        aspectRatio: `${getOptimalAspectRatio(section.title, section.bullets)}`,
                        width: '100%',
                        maxWidth: '1200px',
                    }}
                  >
                    {(() => {
                        // Use layout from selected slide if this slide is selected, otherwise use its own layout
                        const isSelectedSlide = idx === selectedSlideId;
                        const layout = isSelectedSlide ? (outline[selectedSlideId]?.layout || 'image-left') : (section.layout || 'image-left');
                        const img = generatedImages[idx.toString()];
                        console.log(`🖼️ Slide ${idx} image:`, img, 'All generatedImages:', generatedImages);
                        const title = section.title || '';
                        const bullets = section.bullets || [];
                        
                      // Layouts
                      if (layout === 'image-left') {
                        return (
                        <div className="flex h-full">
                              <div className="w-2/5 h-full flex items-center justify-center relative p-2">
                              {img ? (
                                  <>
                                  <div 
                                    className="w-full h-full relative"
                                    style={getImageEffect(selectedThemeKey, layout)}
                                  >
                                    <img 
                                      src={img} 
                                      alt={title} 
                                      className="w-full h-full object-cover"
                                      style={{
                                        borderRadius: 'inherit',
                                        clipPath: 'inherit'
                                      }}
                                    />
                                  </div>
                                    {imageSource === 'Upload Image' ? (
                                      <div className="absolute top-2 right-2 flex gap-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`replace-${idx}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(file);
                                            }
                                          }}
                                          disabled={isUploadingImage}
                                        />
                                        <label
                                          htmlFor={`replace-${idx}`}
                                          className={`bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-200 cursor-pointer ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          title={isUploadingImage ? 'Uploading...' : 'Replace image'}
                                        >
                                          {isUploadingImage ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          ) : (
                                            '📁'
                                          )}
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Regenerate image"
                                        >
                                          <img src={regenImgIcon} alt="Regenerate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                                    <div className="text-gray-400 text-center">
                                      <div className="text-sm">Image Not Found</div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex gap-2">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id={`upload-${idx}`}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleImageUpload(file);
                                          }
                                        }}
                                        disabled={isUploadingImage}
                                      />
                                      <label
                                        htmlFor={`upload-${idx}`}
                                        className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={isUploadingImage ? 'Uploading...' : 'Upload image'}
                                      >
                                        <span className="text-lg">📁</span>
                                        <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                                      </label>

                                    </div>
                                    {imageSource !== 'None' && (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Generate image"
                                        >
                                          <img src={regenImgIcon} alt="Generate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                              )}
                            </div>
                                                    <div className="w-3/5 h-full p-8 flex flex-col justify-center">
                                <div className="mb-6">
                              <ContentEditableDiv
                                value={title}
                                onChange={(newTitle) => {
                                  const newOutline = [...outline];
                                  newOutline[idx] = { ...newOutline[idx], title: newTitle };
                                  setOutline(newOutline);
                                }}
                                onBlur={(newTitle) => {
                                  const newOutline = [...outline];
                                  newOutline[idx] = { ...newOutline[idx], title: newTitle };
                                  setOutline(newOutline);
                                }}
                                className={`w-full bg-transparent border-none outline-none text-3xl font-bold px-4 py-2 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                style={{
                                  wordWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  minHeight: '2rem',
                                  outline: 'none',
                                  overflow: 'visible'
                                }}
                                placeholder="Enter title..."
                              />
                                </div>
                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                  {bullets.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 text-lg mt-1 opacity-80">{getBulletIcon(bulletIndex)}</div>
                                <ContentEditableDiv
                                  value={bullet}
                                  onChange={(newBullet) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = newBullet;
                                    setOutline(newOutline);
                                  }}
                                  onBlur={(newBullet) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = newBullet;
                                    setOutline(newOutline);
                                  }}
                                  className={`w-full bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '3rem',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                  placeholder="Enter bullet point..."
                                />
                                    </div>
                              ))}
                                  <button
                                    className="mt-2 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                    onClick={() => {
                                const newOutline = [...outline];
                                      newOutline[idx].bullets.push('');
                                      if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                      newOutline[idx].bulletsHtml.push('');
                                  setOutline(newOutline);
                                    }}
                                  >
                                    + Add bullet point
                                  </button>
                              </div>
                            </div>
                        </div>
                        );
                      } else if (layout === 'image-right') {
                        return (
                        <div className="flex h-full">
                                                            <div className="w-3/5 h-full p-8 flex flex-col justify-center">
                                <div className="mb-8">
                              <div
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onInput={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                onBlur={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                className={`w-full bg-transparent border-none outline-none text-3xl font-bold px-4 py-2 cursor-text ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                style={{ 
                                  wordWrap: 'break-word',
                                      wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                      minHeight: '2rem',
                                  outline: 'none',
                                  overflow: 'visible',
                                      cursor: 'text',
                                      userSelect: 'text'
                                }}
                              >
                                {section.title || ''}
                              </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-5">
                                  {bullets.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-4 px-2">
                                      <div className="flex-shrink-0 text-lg mt-1">{getBulletIcon(bulletIndex)}</div>
                                <ContentEditableDiv
                                  value={bullet}
                                  onChange={(newBullet) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = newBullet;
                                    setOutline(newOutline);
                                  }}
                                  onBlur={(newBullet) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = newBullet;
                                    setOutline(newOutline);
                                  }}
                                  className={`w-full bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '3rem',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                  placeholder="Enter bullet point..."
                                />
                                    </div>
                              ))}
                                  <button
                                    className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                    onClick={() => {
                                const newOutline = [...outline];
                                      newOutline[idx].bullets.push('');
                                      if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                      newOutline[idx].bulletsHtml.push('');
                                  setOutline(newOutline);
                                    }}
                                  >
                                    + Add bullet point
                                  </button>
                              </div>
                            </div>
                              <div className="w-2/5 h-full flex items-center justify-center relative">
                              {img ? (
                                  <>
                              <img src={img} alt={title} className="w-full h-full object-cover" />
                                    {imageSource === 'Upload Image' ? (
                                      <div className="absolute top-2 right-2 flex gap-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`replace-${idx}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(file);
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`replace-${idx}`}
                                          className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-200 cursor-pointer"
                                          title="Replace image"
                                        >
                                          📁
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Regenerate image"
                                        >
                                          <img src={regenImgIcon} alt="Regenerate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                                    <div className="text-gray-400 text-center">
                                      <div className="text-4xl mb-2">
                                        <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                                      </div>
                                      <div className="text-sm">Image Not Found</div>
                            </div>
                                    {imageSource !== 'None' && (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Generate image"
                                        >
                                          <img src={regenImgIcon} alt="Generate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                              )}
                            </div>
                        </div>
                        );
                      } else if (layout === 'image-top') {
                        return (
                        <div className="flex flex-col h-full">
                              <div className="h-1/2 relative">
                              {img ? (
                                  <>
                              <img src={img} alt={title} className="w-full h-full object-cover" />
                                    {imageSource === 'Upload Image' ? (
                                      <div className="absolute top-2 right-2 flex gap-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`replace-${idx}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(file);
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`replace-${idx}`}
                                          className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-200 cursor-pointer"
                                          title="Replace image"
                                        >
                                          📁
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Regenerate image"
                                        >
                                          <img src={regenImgIcon} alt="Regenerate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                                    <div className="text-gray-400 text-center">
                                      <div className="text-4xl mb-2">
                                        <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                                      </div>
                                      <div className="text-sm">Image Not Found</div>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                      <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                                        onClick={() => handleRegenerateImageWithPrompt(idx)}
                                      >
                                        <span className="text-lg">✨</span>
                                        <span>Add/Replace Image</span>
                                      </button>
                                    </div>
                                    {imageSource !== 'None' && (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Generate image"
                                        >
                                          <img src={regenImgIcon} alt="Generate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="h-1/2 p-12 flex flex-col justify-center overflow-hidden slide-text-container">
                                <div className="mb-6 title-container">
                                                                  <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      onInput={(e) => {
                                  const newOutline = [...outline]; 
                                        newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                      }}
                                      className={`text-center text-4xl font-bold px-8 py-3 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                style={{ 
                                        width: '400px',
                                        maxWidth: '400px',
                                  wordWrap: 'break-word',
                                        wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                        whiteSpace: 'pre-wrap',
                                        boxSizing: 'border-box',
                                        outline: 'none',
                                        border: 'none',
                                        background: 'transparent',
                                        minHeight: '2.5rem',
                                        display: 'block',
                                        margin: '0 auto'
                                      }}
                                    >
                                      {title}
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-4 overflow-hidden">
                                  {bullets.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-4">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                      <div className="flex-1 bullet-container">
                                                                        <div
                                          contentEditable
                                          suppressContentEditableWarning
                                          onInput={(e) => {
                                    const newOutline = [...outline];
                                            newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                          }}
                                          className={`text-lg px-4 py-2 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                            width: '350px',
                                            maxWidth: '350px',
                                    wordWrap: 'break-word',
                                            wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            boxSizing: 'border-box',
                                            outline: 'none',
                                            border: 'none',
                                            background: 'transparent',
                                            minHeight: '2.5rem',
                                            display: 'block'
                                          }}
                                        >
                                          {bullet}
                                        </div>
                                      </div>
                                    </div>
                              ))}
                                  <button
                                    className="mt-2 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                    onClick={() => {
                                const newOutline = [...outline];
                                      newOutline[idx].bullets.push('');
                                      if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                      newOutline[idx].bulletsHtml.push('');
                                  setOutline(newOutline);
                                    }}
                                  >
                                    + Add bullet point
                                  </button>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (layout === 'image-bottom') {
                        return (
                        <div className="flex flex-col h-full">
                                                            <div className="h-2/3 p-8 flex flex-col justify-center">
                                <div className="mb-6">
                              <div
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onInput={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                onBlur={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-4 py-2 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                style={{ 
                                  wordWrap: 'break-word',
                                      wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                      minHeight: '2rem',
                                  outline: 'none',
                                  overflow: 'visible'
                                }}
                              >
                                {title}
                              </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-4">
                                  {bullets.map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 text-lg mt-1">{getBulletIcon(bulletIndex)}</div>
                                      <div
                                        contentEditable={true}
                                        suppressContentEditableWarning={true}
                                        onInput={(e) => {
                                    const newOutline = [...outline];
                                          newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                        }}
                                        onBlur={(e) => {
                                          const newOutline = [...outline];
                                          newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                          setOutline(newOutline);
                                        }}
                                        className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                          outline: 'none',
                                          overflow: 'visible'
                                  }}
                                      >
                                        {bullet}
                                      </div>
                                    </div>
                              ))}
                                  <button
                                    className="mt-2 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                    onClick={() => {
                                const newOutline = [...outline];
                                      newOutline[idx].bullets.push('');
                                      if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                      newOutline[idx].bulletsHtml.push('');
                                  setOutline(newOutline);
                                    }}
                                  >
                                    + Add bullet point
                                  </button>
                              </div>
                            </div>
                              <div className="h-1/3 relative flex items-center justify-center">
                              {img ? (
                                  <>
                              <img src={img} alt={title} className="w-full h-full object-cover" />
                                    {imageSource === 'Upload Image' ? (
                                      <div className="absolute top-2 right-2 flex gap-2">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`replace-${idx}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              handleImageUpload(file);
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor={`replace-${idx}`}
                                          className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-200 cursor-pointer"
                                          title="Replace image"
                                        >
                                          📁
                                        </label>
                                      </div>
                                    ) : (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Regenerate image"
                                        >
                                          <img src={regenImgIcon} alt="Regenerate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center relative">
                                    <div className="text-gray-400 text-center">
                                      <div className="text-4xl mb-2">
                                        <img src={regenImgIcon} alt="Image" className="w-12 h-12 opacity-50" />
                                      </div>
                                      <div className="text-sm">Image Not Found</div>
                                    </div>
                                    <div className="absolute top-2 right-2">
                                      <button
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                                        onClick={() => handleRegenerateImageWithPrompt(idx)}
                                      >
                                        <span className="text-lg">✨</span>
                                        <span>Add/Replace Image</span>
                                      </button>
                                    </div>
                                    {imageSource !== 'None' && (
                                      <div className="absolute top-2 right-2">
                                        <button
                                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 transition-all duration-200"
                                          onClick={() => handleRegenerateImageWithPrompt(idx)}
                                          title="Generate image"
                                        >
                                          <img src={regenImgIcon} alt="Generate" className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                              )}
                            </div>
                          </div>
                        );
                      } else if (layout === 'text-only') {
                        return (
                        <div className="h-full p-8 flex flex-col justify-center text-only-layout">
                                <div className="mb-8">
                              <div
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onInput={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                onBlur={(e) => {
                                  const newOutline = [...outline]; 
                                  newOutline[idx] = { ...newOutline[idx], title: e.currentTarget.textContent || '' };
                                  setOutline(newOutline);
                                }}
                                className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                style={{ 
                                  wordWrap: 'break-word',
                                      wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                      minHeight: '2rem',
                                  outline: 'none',
                                  overflow: 'visible',
                                  maxWidth: '100%'
                                }}
                              >
                                {title}
                                </div>
                              </div>
                              <div className="flex-1 flex flex-col justify-center space-y-4">
                                  {bullets.map((bullet, bulletIndex) => (
                                  <div key={bulletIndex} className="flex items-start space-x-3 px-4">
                                    <div className="flex-shrink-0 w-6 h-6 mt-1 opacity-80">{getBulletIcon(bulletIndex)}</div>
                                    <div
                                      contentEditable={true}
                                      suppressContentEditableWarning={true}
                                      onInput={(e) => {
                                    const newOutline = [...outline];
                                        newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                      }}
                                      onBlur={(e) => {
                                        const newOutline = [...outline];
                                        newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                        setOutline(newOutline);
                                      }}
                                      className={`flex-1 bg-transparent border-none outline-none text-lg px-3 py-2 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                        outline: 'none',
                                        overflow: 'visible',
                                        maxWidth: '100%'
                                  }}
                                    >
                                      {bullet}
                                    </div>
                                    </div>
                            ))}
                                  <button
                                  className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start px-4"
                                    onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                                  + Add bullet point
                                </button>
                            </div>
                          </div>
                        );
                      } else if (layout === '2-columns') {
                        return (
                        <div className="h-full p-8 flex flex-col justify-center">
                              <div className="mb-8">
                              <ControlledTextarea
                                value={section.title || ''}
                                onChange={(newTitle) => {
                                  const newOutline = [...outline];
                                  newOutline[idx] = { ...newOutline[idx], title: newTitle };
                                  setOutline(newOutline);
                                }}
                                onFocus={(e) => {
                                  e.target.select();
                                }}
                                onClick={(e) => {
                                  e.currentTarget.focus();
                                }}
                                className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 resize-none overflow-hidden cursor-text ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                placeholder="Enter title..."
                                style={{
                                  wordWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  minHeight: '2rem',
                                  maxHeight: '8rem',
                                  cursor: 'text',
                                  userSelect: 'text'
                                }}
                              />
                              </div>
                                                            <div className="flex-1 flex gap-8">
                                <div className="w-1/2 flex flex-col justify-center space-y-4">
                                  {bullets.filter(bullet => bullet.trim() !== '').slice(0, Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 text-lg mt-1">{getBulletIcon(bulletIndex)}</div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                    // Remove empty bullets when user leaves the field
                                    if (e.currentTarget.textContent?.trim() === '') {
                                      const newOutline = [...outline];
                                      newOutline[idx].bullets = newOutline[idx].bullets.filter((_, index) => index !== bulletIndex);
                                      setOutline(newOutline);
                                    }
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/2 flex flex-col justify-center space-y-4">
                                  {bullets.filter(bullet => bullet.trim() !== '').slice(Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 text-lg mt-1">{getBulletIcon(bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2))}</div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                    // Remove empty bullets when user leaves the field
                                    if (e.currentTarget.textContent?.trim() === '') {
                                      const newOutline = [...outline];
                                      newOutline[idx].bullets = newOutline[idx].bullets.filter((_, index) => index !== (bulletIndex + Math.ceil(bullets.filter(bullet => bullet.trim() !== '').length / 2)));
                                      setOutline(newOutline);
                                    }
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                                  + Add bullet point
                                </button>
                            </div>
                        );
                      } else if (layout === '3-columns') {
                        return (
                        <div className="h-full p-8 flex flex-col justify-center">
                              <div className="mb-8">
                              <ControlledTextarea
                                value={section.title || ''}
                                onChange={(newTitle) => {
                                  const newOutline = [...outline];
                                  newOutline[idx] = { ...newOutline[idx], title: newTitle };
                                  setOutline(newOutline);
                                }}
                                onFocus={(e) => {
                                  e.target.select();
                                }}
                                onClick={(e) => {
                                  e.currentTarget.focus();
                                }}
                                className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 resize-none overflow-hidden cursor-text ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                placeholder="Enter title..."
                                style={{
                                  wordWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  minHeight: '2rem',
                                  maxHeight: '8rem',
                                  cursor: 'text',
                                  userSelect: 'text'
                                }}
                              />
                              </div>
                              <div className="flex-1 flex gap-6">
                                <div className="w-1/3 flex flex-col justify-center space-y-4">
                                  {bullets.slice(0, Math.ceil(bullets.length / 3)).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/3 flex flex-col justify-center space-y-4">
                                  {bullets.slice(Math.ceil(bullets.length / 3), Math.ceil(bullets.length / 3) * 2).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.length / 3)} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 3)] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 3)] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/3 flex flex-col justify-center space-y-4">
                                  {bullets.slice(Math.ceil(bullets.length / 3) * 2).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.length / 3) * 2} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 3) * 2] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 3) * 2] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                                  + Add bullet point
                                </button>
                            </div>
                        );
                      } else if (layout === '4-columns') {
                        return (
                        <div className="h-full p-8 flex flex-col justify-center">
                              <div className="mb-8">
                              <ControlledTextarea
                                value={section.title || ''}
                                onChange={(newTitle) => {
                                  const newOutline = [...outline];
                                  newOutline[idx] = { ...newOutline[idx], title: newTitle };
                                  setOutline(newOutline);
                                }}
                                onFocus={(e) => {
                                  e.target.select();
                                }}
                                onClick={(e) => {
                                  e.currentTarget.focus();
                                }}
                                className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 resize-none overflow-hidden cursor-text ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                placeholder="Enter title..."
                                style={{
                                  wordWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                  whiteSpace: 'pre-wrap',
                                  minHeight: '2rem',
                                  maxHeight: '8rem',
                                  cursor: 'text',
                                  userSelect: 'text'
                                }}
                              />
                              </div>
                              <div className="flex-1 flex gap-4">
                                <div className="w-1/4 flex flex-col justify-center space-y-4">
                                  {bullets.slice(0, Math.ceil(bullets.length / 4)).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/4 flex flex-col justify-center space-y-4">
                                  {bullets.slice(Math.ceil(bullets.length / 4), Math.ceil(bullets.length / 4) * 2).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.length / 4)} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4)] = e.currentTarget.textContent || '';
                                      setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4)] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/4 flex flex-col justify-center space-y-4">
                                  {bullets.slice(Math.ceil(bullets.length / 4) * 2, Math.ceil(bullets.length / 4) * 3).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.length / 4) * 2} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4) * 2] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4) * 2] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="w-1/4 flex flex-col justify-center space-y-4">
                                  {bullets.slice(Math.ceil(bullets.length / 4) * 3).map((bullet, bulletIndex) => (
                                    <div key={bulletIndex + Math.ceil(bullets.length / 4) * 3} className="flex items-start space-x-3 px-2">
                                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-current opacity-60 mt-2"></div>
                                <div
                                  contentEditable={true}
                                  suppressContentEditableWarning={true}
                                  onInput={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4) * 3] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  onBlur={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex + Math.ceil(bullets.length / 4) * 3] = e.currentTarget.textContent || '';
                                    setOutline(newOutline);
                                  }}
                                  className={`flex-1 bg-transparent border-none outline-none text-lg px-2 py-1 ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  style={{ 
                                    wordWrap: 'break-word',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    minHeight: '1.5rem',
                                    outline: 'none',
                                    overflow: 'visible'
                                  }}
                                >
                                  {bullet}
                                </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <button
                                className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                                  + Add bullet point
                                </button>
                            </div>
                        );
                      } else if (layout === 'paragraph') {
                        return (
                        <div className="h-full p-8 flex flex-col justify-center" style={{overflow: 'visible', height: 'auto', minHeight: 0}}>
                          <div className="mb-8">
                                <textarea 
                              value={title} 
                                        onChange={(e) => {
                                    const newOutline = [...outline];
                                newOutline[idx] = { ...newOutline[idx], title: e.target.value };
                                      setOutline(newOutline);
                                          // Auto-expand textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }} 
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                              className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 resize-none ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                              placeholder="Enter title..."
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                minHeight: '2rem',
                                maxHeight: '8rem',
                                width: '100%',
                                boxSizing: 'border-box',
                                overflowY: 'auto',
                                height: 'auto',
                                  }}
                                />
                                    </div>
                          <div className="flex-1 flex flex-col justify-center space-y-6" style={{overflow: 'visible', height: 'auto', minHeight: 0}}>
                            {bullets.map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="w-full">
                                <textarea 
                                        value={bullet}
                                        onChange={(e) => {
                                    const newOutline = [...outline];
                                    newOutline[idx].bullets[bulletIndex] = e.target.value;
                                      setOutline(newOutline);
                                          // Auto-expand textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }} 
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  className={`w-full bg-transparent border-none outline-none text-lg px-4 py-3 resize-none ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                  placeholder="Enter paragraph..."
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                    minHeight: '8rem',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    height: 'auto',
                                  }}
                                />
                                    </div>
                                  ))}
                              <button
                                className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                              + Add paragraph
                                </button>
                          </div>
                            </div>
                        );
                      } else {
                      // Default fallback
                        return (
                        <div className="h-full p-8 flex flex-col justify-center">
                              <div className="mb-8">
                              <textarea 
                                value={title} 
                                    onChange={(e) => {
                                  const newOutline = [...outline]; 
                                      newOutline[idx] = { ...newOutline[idx], title: e.target.value };
                                  setOutline(newOutline);
                                      
                                      // Auto-expand textarea
                                  e.target.style.height = 'auto';
                                  e.target.style.height = e.target.scrollHeight + 'px';
                                }} 
                                onInput={(e) => {
                                  const target = e.target as HTMLTextAreaElement;
                                  target.style.height = 'auto';
                                  target.style.height = target.scrollHeight + 'px';
                                }}
                                    className={`w-full bg-transparent border-none outline-none text-center text-4xl font-bold px-6 py-3 resize-none overflow-hidden ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.titleClass}`}
                                    placeholder="Enter title..."
                                style={{ 
                                  wordWrap: 'break-word',
                                      wordBreak: 'break-word',
                                  overflowWrap: 'break-word',
                                      whiteSpace: 'pre-wrap',
                                      minHeight: '2rem',
                                      maxHeight: '8rem'
                                }}
                              />
                              </div>
                              <div className="flex-1 flex flex-col justify-center space-y-5">
                                {bullets.map((bullet, bulletIndex) => (
                                  <div key={bulletIndex} className="flex items-start space-x-4 px-4">
                                    <div className="flex-shrink-0 w-3 h-3 rounded-full bg-current opacity-60 mt-1"></div>
                                <textarea 
                                        value={bullet}
                                        onChange={(e) => {
                                    const newOutline = [...outline];
                                          newOutline[idx].bullets[bulletIndex] = e.target.value;
                                      setOutline(newOutline);
                                          
                                          // Auto-expand textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                  }} 
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                        className={`flex-1 bg-transparent border-none outline-none text-lg px-3 py-2 resize-none overflow-hidden ${THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.bodyClass}`}
                                        placeholder="Enter bullet point..."
                                  style={{ 
                                    wordWrap: 'break-word',
                                          wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                          whiteSpace: 'pre-wrap',
                                          minHeight: '3rem',
                                          maxHeight: '16rem'
                                  }}
                                />
                                  </div>
                            ))}
                                <button
                                  className="mt-4 text-gamma-blue hover:text-blue-700 text-sm font-medium self-start"
                                  onClick={() => {
                              const newOutline = [...outline];
                                    newOutline[idx].bullets.push('');
                                    if (!newOutline[idx].bulletsHtml) newOutline[idx].bulletsHtml = [];
                                    newOutline[idx].bulletsHtml.push('');
                                setOutline(newOutline);
                                  }}
                                >
                                  + Add bullet point
                                </button>
                              </div>
                            </div>
                        );
                      }
                    })()}
                </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Layout Options Toolbar - Vertical on Far Right Edge */}
            <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
              <div className="bg-white rounded-l-2xl shadow-lg border border-gray-200 p-3 flex flex-col gap-2 overflow-hidden">
                <div className="text-xs font-medium text-gray-700 mb-2 text-center">Layout</div>
                    {[
                  { value: 'image-left', label: 'Image Left', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="4" width="8" height="16" rx="2" fill="currentColor" opacity="0.2"/>
                            <rect x="12" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                  { value: 'image-right', label: 'Image Right', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="14" y="4" width="8" height="16" rx="2" fill="currentColor" opacity="0.2"/>
                            <rect x="2" y="4" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },

                  { value: 'image-bottom', label: 'Image Bottom', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="12" width="20" height="8" rx="2" fill="currentColor" opacity="0.2"/>
                            <rect x="2" y="4" width="20" height="6" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                  { value: 'text-only', label: 'Text Only', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity="0.1"/>
                            <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="16" x2="14" y2="16" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                  { value: '2-columns', label: '2 Columns', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                  { value: '3-columns', label: '3 Columns', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="11" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="18" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                  { value: '4-columns', label: '4 Columns', icon: (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="7" y1="4" x2="7" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="17" y1="4" x2="17" y2="20" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="9" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="14" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="19" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                  ) },
                    ].map(opt => (
                      <button
                        key={opt.value}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                          ((outline[selectedSlideId]?.layout || 'image-left') === opt.value) 
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          const newOutline = [...outline];
                          if (newOutline[selectedSlideId]) {
                            newOutline[selectedSlideId].layout = opt.value;
                            setOutline(newOutline);
                          }
                        }}
                        title={opt.label}
                      >
                        {opt.icon}
                      </button>
                    ))}
              </div>
            </div>
          </div>
        )}
        {currentStep === 4 && (
          <div className="py-12 flex flex-col items-center w-full">
            <h1 className="text-3xl font-bold mb-8">Finish</h1>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4">Summary</h2>
              {/* Summary of user choices (dynamic) */}
              <div className="w-full mb-6">
                <div className="mb-2"><span className="font-semibold">Title:</span> {finalTitle}</div>
                <div className="mb-2"><span className="font-semibold">Outline:</span>
                  <ol className="list-decimal ml-6">
                    {outline.map((section, idx) => (
                      <li key={idx}>{section.title}</li>
                    ))}
                  </ol>
                </div>
                <div className="mb-2"><span className="font-semibold">Theme:</span> {THEME_PREVIEWS.find(t => t.key === selectedThemeKey)?.label}</div>
                <div className="mb-2"><span className="font-semibold">Number of slides:</span> {slideCount}</div>
                <div className="mb-2"><span className="font-semibold">Amount of text:</span> {amountOfText}</div>
                <div className="mb-2"><span className="font-semibold">Image source:</span> {imageSource}</div>
                <div className="mb-2"><span className="font-semibold">Image style:</span> {imageStyle || '(none)'}</div>
              </div>
              <button
                className="w-full mt-4 px-6 py-4 bg-gamma-blue text-white rounded-full font-bold text-lg shadow-lg hover:bg-blue-700 transition text-center flex items-center justify-center gap-2"
                onClick={handleFinalGenerate}
                disabled={generationStatus === 'loading'}
              >
                <span className="text-xl">✨</span> {generationStatus === 'loading' ? 'Generating...' : 'Generate'}
              </button>
              {generationStatus === 'success' && <div className="mt-4 text-green-600 font-semibold">Slides generated successfully!</div>}
              {generationStatus === 'error' && <div className="mt-4 text-red-600 font-semibold">Failed to generate slides.</div>}
              <button className="mt-8 text-gamma-blue underline" onClick={() => setCurrentStep(0)}>Start Over</button>
            </div>
          </div>
        )}
        </div>

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={() => setExportModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setExportModalOpen(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="Export">📤</span> Export Presentation
            </h2>

            {/* Export options */}
            <div className="space-y-4">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-blue-50 transition" onClick={async () => {
  const slidesToExport = outline.map((section, idx) => ({
    id: `slide-${idx+1}`,
    title: section.title,
    titleHtml: section.titleHtml, // Include HTML content for titles
    bullets: section.bullets,
    bulletsHtml: section.bulletsHtml, // Include HTML content for bullets
    image: generatedImages[idx.toString()] ? { url: generatedImages[idx.toString()], alt: section.title, source: 'ideogram' } : undefined,
    layout: section.layout || 'image-left',
    elements: section.elements || []
  }));
  const exportTheme = defaultThemes.find(t => t.id === selectedThemeKey);
  await exportEditablePPTX(slidesToExport, presentationTitle, exportTheme);
  setExportModalOpen(false);
}}>
                <span className="bg-orange-100 text-orange-600 rounded-full p-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" /></svg></span>
                <span className="flex-1 text-left">Export to PowerPoint</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-blue-50 transition" onClick={() => { alert('To use Google Slides, export as PPTX and import to Google Slides.'); setExportModalOpen(false); }}>
                <span className="bg-yellow-100 text-yellow-700 rounded-full p-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><rect width="16" height="12" x="2" y="4" rx="2" fill="#F4B400" /><rect width="12" height="8" x="4" y="6" rx="1" fill="#fff" /></svg></span>
                <span className="flex-1 text-left">Export to Google Slides <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">NEW</span></span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border hover:bg-blue-50 transition" onClick={handleExportPNGs}>
                <span className="bg-purple-100 text-purple-700 rounded-full p-2"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><rect width="16" height="12" x="2" y="4" rx="2" fill="#A78BFA" /><rect width="12" height="8" x="4" y="6" rx="1" fill="#fff" /></svg></span>
                <span className="flex-1 text-left">Export as PNGs</span>
              </button>
            </div>
            {/* Google Slides tip */}
            <div className="mt-6 bg-blue-50 text-blue-900 text-sm rounded-lg p-4">
              <b>Tip:</b> To use Google Slides, export as PowerPoint and import the PPTX file into Google Slides.
            </div>
          </div>
        </div>
      )}

      {/* Image Regeneration Modal */}
      {imageRegenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" onClick={() => {
          setImageRegenerateModalOpen(false);
          setRegeneratingImageIndex(null);
          setCustomImagePrompt('');
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => {
              setImageRegenerateModalOpen(false);
              setRegeneratingImageIndex(null);
              setCustomImagePrompt('');
            }}>&times;</button>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <img src={regenImgIcon} alt="Image" className="w-6 h-6" /> Add/Replace Image
            </h2>
            <p className="text-gray-600 mb-4">
              Generate an AI image or upload your own for slide {regeneratingImageIndex !== null ? regeneratingImageIndex + 1 : ''}.
            </p>
            {regeneratingImageIndex !== null && generatedImages[regeneratingImageIndex.toString()] && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Current image:</p>
                <img 
                  src={generatedImages[regeneratingImageIndex.toString()]} 
                  alt="Current slide image" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Prompt
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gamma-blue focus:border-transparent resize-none"
                  rows={4}
                  value={customImagePrompt}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                />
              </div>
              
              {/* Upload Image Option */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Or Upload Your Own Image</h4>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(file);
                        // Close modal after upload
                        setImageRegenerateModalOpen(false);
                        setRegeneratingImageIndex(null);
                        setCustomImagePrompt('');
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500">
                    Supported: JPG, PNG, GIF, WebP (Max 5MB)
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  onClick={() => {
                    console.log('Canceling image generation...');
                    setImageRegenerateModalOpen(false);
                    setRegeneratingImageIndex(null);
                    setCustomImagePrompt('');
                    setIsGeneratingImage(false);
                    console.log('Modal state reset');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-gamma-blue text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  onClick={handleRegenerateImage}
                  disabled={!customImagePrompt.trim() || isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span role="img" aria-label="Generate">✨</span>
                      Generate Image
                    </>
                  )}
                </button>
                {regeneratingImageIndex !== null && (
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    onClick={() => {
                      console.log('Force stopping image generation...');
                      setRegeneratingImageIndex(null);
                      setImageRegenerateModalOpen(false);
                      setCustomImagePrompt('');
                      setIsGeneratingImage(false);
                      alert('Generation cancelled. You can try again.');
                    }}
                  >
                    Force Stop
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  onClick={() => {
                    console.log('Manual reset triggered');
                    setRegeneratingImageIndex(null);
                    setImageRegenerateModalOpen(false);
                    setCustomImagePrompt('');
                    setIsGeneratingImage(false);
                    // Force refresh the current image
                    const newImages = { ...generatedImages };
                    delete newImages[regeneratingImageIndex?.toString() || '0'];
                    setGeneratedImages(newImages);
                    alert('State reset. Try generating again.');
                  }}
                >
                  Reset State
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(user, token) => {
          // Handle successful authentication
          console.log('User authenticated:', user);
          setAuthModalOpen(false);
          // Update local authentication state
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
          // Update local state immediately
          setLocalUser(user);
          setLocalIsAuthenticated(true);
        }}
      />
      
      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={localUser || user} // Pass the actual authenticated user
        token={localStorage.getItem('authToken') || ''}
        onProfileUpdate={(updatedUser) => {
          console.log('Profile updated:', updatedUser);
          // Update local user state
          setLocalUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setProfileModalOpen(false);
        }}
        onPresentationSelect={(presentation) => {
          console.log('ProfileModal: Loading presentation:', presentation);
          // Load the selected presentation
          loadPresentation(presentation);
          setProfileModalOpen(false);
        }}
        onLogout={() => {
          console.log('Logout requested');
          // Clear local storage
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          // Reset local state
          setLocalUser(null);
          setLocalIsAuthenticated(false);
          // Close profile modal
          setProfileModalOpen(false);
          // Reset app state
          setCurrentStep(1);
          setOutline([]);
          setSlides([]);
          setFinalTitle('');
          setPresentationTitle('');
          setCurrentPresentationId(null);
          setGeneratedImages({});
          setTypingBullets({});
          setAmountOfText('detailed');
          setImageSource('ai');
          setImageStyle('');
          setSlideCount(5);
          setSelectedThemeKey('clean-white');
          setSelectedSlideId(null);
          setCanUndo(false);
          // setDeletedSlide(null); // This state variable doesn't exist
          setDraggedSlideIndex(null);
          setLastSaved(null);
          setIsSaving(false);
          setIsGenerating(false);
          setImageRegenerateModalOpen(false);
          setRegeneratingImageIndex(null);
          setCustomImagePrompt('');
          setIsGeneratingImage(false);
          setExportModalOpen(false);
          setRecentPresentationsOpen(false);
          setProfileModalOpen(false);
          setAuthModalOpen(false);
        }}
        onDeleteAccount={() => {
          console.log('Delete account requested');
          if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
            // Call backend to delete account
            const token = localStorage.getItem('authToken');
            if (token) {
              console.log('🔐 Token found, calling delete API...');
              const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3002/api'}/auth/delete-all-data`;
              console.log('🌐 API URL:', apiUrl);
              
              fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              })
              .then(async response => {
                console.log('📡 Delete account response status:', response.status);
                console.log('📡 Delete account response headers:', Object.fromEntries(response.headers.entries()));
                
                if (response.ok) {
                  const responseData = await response.json();
                  console.log('✅ Account deleted successfully:', responseData);
                  
                  // Clear local storage
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  
                  // Reset all state
                  setLocalUser(null);
                  setLocalIsAuthenticated(false);
                  setProfileModalOpen(false);
                  
                  // Reset app state (same as logout)
                  setCurrentStep(1);
                  setOutline([]);
                  setSlides([]);
                  setFinalTitle('');
                  setPresentationTitle('');
                  setCurrentPresentationId(null);
                  setGeneratedImages({});
                  setTypingBullets({});
                  setAmountOfText('detailed');
                  setImageSource('ai');
                  setImageStyle('');
                  setSlideCount(5);
                  setSelectedThemeKey('clean-white');
                  setSelectedSlideId(null);
                  setCanUndo(false);
                  // setDeletedSlide(null); // This state variable doesn't exist
                  setDraggedSlideIndex(null);
                  setLastSaved(null);
                  setIsSaving(false);
                  setIsGenerating(false);
                  setImageRegenerateModalOpen(false);
                  setRegeneratingImageIndex(null);
                  setCustomImagePrompt('');
                  setIsGeneratingImage(false);
                  setExportModalOpen(false);
                  setRecentPresentationsOpen(false);
                  setProfileModalOpen(false);
                  setAuthModalOpen(false);
                  
                  alert('Your account has been deleted successfully.');
                } else {
                  const errorText = await response.text();
                  console.error('❌ Failed to delete account:', response.status, errorText);
                  
                  try {
                    const errorData = JSON.parse(errorText);
                    alert(`Failed to delete account: ${errorData.message || 'Unknown error'}`);
                  } catch {
                    alert(`Failed to delete account: ${response.status} ${errorText}`);
                  }
                }
              })
              .catch(error => {
                console.error('❌ Network error deleting account:', error);
                alert(`Network error deleting account: ${error.message}`);
              });
            } else {
              console.error('❌ No auth token found');
              alert('No authentication token found. Please log in again.');
            }
          }
        }}
      />
      
      {/* Recent Presentations Modal */}
      <RecentPresentations
        isOpen={recentPresentationsOpen}
        onClose={() => setRecentPresentationsOpen(false)}
        onPresentationSelect={(presentation) => {
          console.log('Selected presentation:', presentation);
          // Load the selected presentation
          loadPresentation(presentation);
          setRecentPresentationsOpen(false);
        }}
      />
    </div>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App; 