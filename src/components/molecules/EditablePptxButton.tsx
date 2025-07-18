import React, { useState } from 'react';
import { SlideCard } from '../../types';
import pptxgen from 'pptxgenjs';

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

  const handleDownload = async () => {
    if (slides.length === 0) {
      alert('No slides to download. Please generate some slides first.');
      return;
    }

    setIsDownloading(true);
    
    try {
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
      
      // Set default font to ensure compatibility
      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: 'FFFFFF' },
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
        
        // Set slide background based on theme
        if (theme?.backgroundImage) {
          // Add background image if theme has one
          try {
            pptxSlide.background = { 
              path: theme.backgroundImage,
              sizing: { type: 'cover', w: 13.33, h: 7.5 }
            };
          } catch (error) {
            console.warn('Could not set background image, using color fallback:', error);
            pptxSlide.background = { color: theme?.colors?.background || '#FFFFFF' };
          }
        } else {
          // Use theme background color
          pptxSlide.background = { color: theme?.colors?.background || '#FFFFFF' };
        }

        // Add title
        if (slide.title) {
          pptxSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: 12.33,
            h: 1,
            fontSize: 28,
            fontFace: 'Arial',
            fontWeight: 'bold',
            color: theme?.colors?.primary || '#000000',
            align: 'left',
            valign: 'top'
          });
        }

        // Add bullet points
        if (slide.bullets && slide.bullets.length > 0) {
          const bulletText = slide.bullets.join('\n');
          pptxSlide.addText(bulletText, {
            x: 0.5,
            y: 2,
            w: 6,
            h: 5,
            fontSize: 18,
            fontFace: 'Arial',
            fontWeight: 'normal',
            color: theme?.colors?.text || '#000000',
            align: 'left',
            valign: 'top',
            bullet: { type: 'bullet' }
          });
        }

        // Add image if present
        if (slide.image && slide.image.url) {
          try {
            // Convert image URL to data URL if it's a server URL
            let imagePath = slide.image.url;
            if (slide.image.url.includes('localhost:3001') || slide.image.url.startsWith('http')) {
              // Convert server image to data URL
              try {
                const response = await fetch(slide.image.url, {
                  mode: 'cors',
                  credentials: 'omit'
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const blob = await response.blob();
                const dataUrl = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error('Failed to read image data'));
                  reader.readAsDataURL(blob);
                });
                
                pptxSlide.addImage({
                  data: dataUrl,
                  x: 7,
                  y: 2,
                  w: 5.5,
                  h: 4,
                  sizing: { type: 'contain' }
                });
              } catch (fetchError) {
                console.warn('Failed to fetch image, using placeholder:', fetchError);
                // Add a placeholder if image fetch fails
                pptxSlide.addText('AI Generated Image', {
                  x: 7,
                  y: 2,
                  w: 5.5,
                  h: 4,
                  fontSize: 14,
                  color: '#666666',
                  align: 'center',
                  valign: 'middle',
                  fill: { color: '#F0F0F0' },
                  border: { color: '#CCCCCC', pt: 1 }
                });
              }
            } else {
              pptxSlide.addImage({
                path: imagePath,
                x: 7,
                y: 2,
                w: 5.5,
                h: 4,
                sizing: { type: 'contain' }
              });
            }
          } catch (error) {
            console.warn('Could not add image to slide:', error);
            // Add a placeholder text if image fails
            pptxSlide.addText('AI Generated Image', {
              x: 7,
              y: 2,
              w: 5.5,
              h: 4,
              fontSize: 14,
              color: '#666666',
              align: 'center',
              valign: 'middle',
              fill: { color: '#F0F0F0' },
              border: { color: '#CCCCCC', pt: 1 }
            });
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