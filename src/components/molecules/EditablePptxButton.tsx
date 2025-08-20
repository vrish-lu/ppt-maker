import React, { useState } from 'react';
import { SlideCard } from '../../types';
import pptxgen from 'pptxgenjs';
import { 
  getContrastingTextColors, 
  getFontFamily, 
  getFontSize, 
  getTextAlignment, 
  getFontWeight,
  normalizeColor 
} from '../../utils/themeColors';

interface EditablePptxButtonProps {
  slides: SlideCard[];
  title: string;
  theme?: any;
  disabled?: boolean;
}

const EditablePptxButton: React.FC<EditablePptxButtonProps> = ({
  slides,
  title,
  theme,
  disabled = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string>('');

  // Use enhanced font and color utilities

  const handleDownload = async () => {
    if (slides.length === 0) {
      alert('No slides to download. Please generate some slides first.');
      return;
    }

    setIsDownloading(true);
    
    try {
      console.log('Starting PPTX generation with theme:', theme);
      
      setDownloadProgress('Creating editable PPTX...');
      
      // Create a new PowerPoint presentation
      const pptx = new pptxgen();
      
      // Set presentation properties
      pptx.author = 'NewGamma AI';
      pptx.company = 'NewGamma';
      pptx.title = title;
      pptx.subject = 'AI Generated Presentation';
      
      // Use standard 16:9 aspect ratio
      pptx.defineLayout({ name: '16x9', width: 13.33, height: 7.5 });
      pptx.layout = '16x9';
      
      // Create master slide without background (will be set per slide)
      console.log('Creating master slide without background (will be set per slide)');
      
      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        objects: ['title', 'body']
      });

      // Process each slide
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        setDownloadProgress(`Creating slide ${i + 1}/${slides.length}...`);
        
        // Add a small delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Add a new slide with master layout
        const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        
        // Set slide background based on theme - match preview behavior
        console.log('Setting background for slide', i + 1, 'with theme:', theme?.id);
        
        // Priority: backgroundImage > backgroundGradient > background color
        if (theme?.backgroundImage) {
          // Add background image if theme has one (highest priority)
          try {
            // Ensure the image path is correct for PPTX generation
            let imagePath = theme.backgroundImage;
            
            // If the path starts with /, it's a public asset
            if (imagePath.startsWith('/')) {
              // For PPTX generation, we need to use the full path
              // The image should be in the public folder
              imagePath = imagePath.substring(1); // Remove leading slash
            }
            
            console.log('Using background image path:', imagePath);
            
            if (imagePath) {
              pptxSlide.background = { path: imagePath };
            }
            console.log('Set background image for slide:', imagePath);
          } catch (error) {
            console.warn('Could not set background image for slide:', error);
            // Fallback to background color if image fails
            const bgColor = theme?.colors?.background || 'FFFFFF';
            pptxSlide.background = { color: bgColor };
            console.log('Fallback to background color:', bgColor);
          }
        } else if (theme?.backgroundGradient) {
          // Handle gradient backgrounds for PPTX
          console.log('Processing gradient background:', theme.backgroundGradient);
          
          // For the creative gradient theme, create a gradient from yellow to orange
          if (typeof theme.backgroundGradient === 'string' && theme.backgroundGradient.includes('yellow-50') && theme.backgroundGradient.includes('orange-500')) {
            // Create a gradient using a canvas and convert to data URL
            const canvas = document.createElement('canvas');
            canvas.width = 1920; // 16:9 aspect ratio
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              // Create linear gradient from left to right
              const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
              gradient.addColorStop(0, '#FFFBF0'); // yellow-50
              gradient.addColorStop(1, '#F97316'); // orange-500
              
              // Fill the canvas with the gradient
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Convert to data URL
              const gradientDataUrl = canvas.toDataURL('image/png');
              
              // Use the gradient as background image
              if (gradientDataUrl) {
                pptxSlide.background = { path: gradientDataUrl };
              }
              console.log('Set gradient background');
            } else {
              // Fallback to solid color if canvas is not available
              const bgColor = 'FFFBF0';
              pptxSlide.background = { color: bgColor };
              console.log('Canvas fallback to background color:', bgColor);
            }
          } else {
            // Fallback for other gradients - use theme background color
            const bgColor = theme?.colors?.background || 'FFFFFF';
            pptxSlide.background = { color: bgColor };
            console.log('Gradient fallback to background color:', bgColor);
          }
        } else {
          // Use theme background color as last resort
          const bgColor = theme?.colors?.background || 'FFFFFF';
          pptxSlide.background = { color: bgColor };
          console.log('Set solid background color:', bgColor);
        }

        // Get enhanced text colors and styling
        const textColors = getContrastingTextColors(theme);
        const fontFamily = getFontFamily(theme, 'heading');
        const bodyFontFamily = getFontFamily(theme, 'body');
        const fontSize = getFontSize(theme, 'heading');
        const bodyFontSize = getFontSize(theme, 'body');
        const textAlignment = getTextAlignment(theme);
        const titleWeight = getFontWeight(theme, 'heading');
        const bodyWeight = getFontWeight(theme, 'body');

        // --- Layout logic ---
        const layout = slide.layout || 'image-left';
        // Default positions
        let titleBox = { x: 7, y: 1, w: 5.5, h: 1.2 };
        let bulletsBox = { x: 7, y: 2.5, w: 5.5, h: 4.5 };
        let imageBox = { x: 0.5, y: 1, w: 5.5, h: 5.5 };
        let showTitle = true, showBullets = true, showImage = !!(slide.image && slide.image.url);
        let overlayText = false;
        switch (layout) {
          case 'image-left':
          default:
            // Already set as default
            break;
          case 'image-right':
            titleBox = { x: 1, y: 1, w: 5.5, h: 1.2 };
            bulletsBox = { x: 1, y: 2.5, w: 5.5, h: 4.5 };
            imageBox = { x: 7.33, y: 1, w: 5.5, h: 5.5 };
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
        // --- Add content based on layout ---
        if (showTitle && slide.title && !overlayText) {
          // For text-only layout, use larger font size
          let adjustedFontSize = fontSize;
          if (layout === 'text-only') {
            adjustedFontSize = fontSize + 4;
          }
          
          pptxSlide.addText(slide.title, {
            ...titleBox,
            fontSize: adjustedFontSize,
            fontFace: fontFamily,
            bold: titleWeight === 'bold',
            color: normalizeColor(textColors.title),
            align: textAlignment as 'left' | 'center' | 'right',
            valign: 'top'
          });
        }
        if (showBullets && slide.bullets && slide.bullets.length > 0 && !overlayText) {
          // Handle text-only layout differently to prevent overlapping
          if (layout === 'text-only') {
            // For text-only layout, add bullets with proper spacing
            slide.bullets.forEach((bullet, index) => {
              const bulletY = bulletsBox.y + (index * 0.8);
              const bulletHeight = 0.7;
              
              pptxSlide.addText(bullet, {
                x: bulletsBox.x + 0.3, // Add some padding for bullet icon
                y: bulletY,
                w: bulletsBox.w - 0.6,
                h: bulletHeight,
                fontSize: bodyFontSize,
                fontFace: bodyFontFamily,
                bold: bodyWeight === 'bold',
                color: normalizeColor(textColors.text),
                align: textAlignment as 'left' | 'center' | 'right',
                valign: 'top',
                bullet: { type: 'number', startAt: index + 1 }
              });
            });
          } else {
            // For other layouts, use the original approach
            const bulletText = slide.bullets.join('\n');
            pptxSlide.addText(bulletText, {
              ...bulletsBox,
              fontSize: bodyFontSize,
              fontFace: bodyFontFamily,
              bold: bodyWeight === 'bold',
              color: normalizeColor(textColors.text),
              align: textAlignment as 'left' | 'center' | 'right',
              valign: 'top',
              bullet: true
            });
          }
        }
        // Overlay text for full-image
        if (overlayText) {
          let overlayY = 1.5;
          if (slide.title) {
            pptxSlide.addText(slide.title, {
              x: 0.5, y: overlayY, w: 12.33, h: 1.2,
              fontSize: fontSize + 4,
              fontFace: fontFamily,
              bold: titleWeight === 'bold',
              color: 'FFFFFF',
              align: 'center',
              valign: 'top'
            });
            overlayY += 1.3;
          }
          if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
            pptxSlide.addText(slide.bullets.join('\n'), {
              x: 1, y: overlayY, w: 11.33, h: 3,
              fontSize: bodyFontSize + 2,
              fontFace: bodyFontFamily,
              bold: bodyWeight === 'bold',
              color: 'FFFFFF',
              align: 'center',
              valign: 'top',
              bullet: true
            });
          }
        }
        // Add image if present and allowed by layout
        if (showImage && slide.image && slide.image.url) {
          try {
            let imagePath = slide.image.url;
            if (slide.image.url.includes('localhost:3002') || slide.image.url.startsWith('http')) {
              try {
                const response = await fetch(slide.image.url, {
                  mode: 'cors',
                  credentials: 'omit'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const blob = await response.blob();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error('Failed to read image data'));
                  reader.readAsDataURL(blob);
                });
                pptxSlide.addImage({
                  data: dataUrl,
                  ...imageBox,
                  sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
                });
              } catch (fetchError) {
                pptxSlide.addText('AI Generated Image', {
                  ...imageBox,
                  fontSize: 14,
                  color: '#666666',
                  align: 'center',
                  valign: 'middle',
                  fill: { color: '#F0F0F0' }
                });
              }
            } else {
              pptxSlide.addImage({
                path: imagePath,
                ...imageBox,
                sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
              });
            }
          } catch (error) {
            pptxSlide.addText('AI Generated Image', {
              ...imageBox,
              fontSize: 14,
              color: '#666666',
              align: 'center',
              valign: 'middle',
              fill: { color: '#F0F0F0' }
            });
          }
        }

        // Add SVG elements as images
        if (slide.elements && slide.elements.length > 0) {
          for (const el of slide.elements) {
            try {
              // Fetch SVG and convert to data URL
              const response = await fetch(el.svg);
              if (!response.ok) continue;
              const svgText = await response.text();
              const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
              const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
              // Map percent coordinates to slide (assume 13.33 x 7.5 inches)
              const slideW = 13.33, slideH = 7.5;
              const x = (el.x / 100) * slideW;
              const y = (el.y / 100) * slideH;
              const w = (el.w / 100) * slideW;
              const h = (el.h / 100) * slideH;
              pptxSlide.addImage({
                data: dataUrl,
                x, y, w, h
              });
            } catch (err) {
              console.warn('Could not add SVG element to PPTX:', err);
            }
          }
        }
      }

      setDownloadProgress('Saving PPTX file...');
      
      // Save the presentation
      await pptx.writeFile({ 
        fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}_editable.pptx` 
      });
      
      setDownloadProgress('Download complete!');
      setTimeout(() => setDownloadProgress(''), 2000);
      
    } catch (error) {
      console.error('Editable PPTX download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || slides.length === 0 || isDownloading}
      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isDownloading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {downloadProgress || 'Creating...'}
        </>
      ) : (
        <>
          <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          Editable PPTX
        </>
      )}
    </button>
  );
};

export default EditablePptxButton; 