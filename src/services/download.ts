import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';
import { getContrastingTextColors } from '../utils/themeColors';
import { defaultThemes } from '../data/themes';

// Function to apply image effects for export (simplified version for download service)
const applyImageEffectForExport = async (imageUrl: string, themeKey: string, layout: string) => {
  try {
    console.log('🔍 Applying image effects for export (download service):', { themeKey, layout });
    
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

    // Get the effect styles based on theme
    const effects = {
      // Modern themes - Geometric effects
      'modern-blue': {
        transform: 'scale(1.02)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(59, 130, 246, 0.2)',
        border: '2px solid rgba(59, 130, 246, 0.3)',
        position: 'relative'
      },
      'modern-dark': {
        transform: 'scale(1.05)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(156, 163, 175, 0.3)',
        border: '2px solid rgba(156, 163, 175, 0.4)',
        position: 'relative'
      },
      'tech-cyber': {
        transform: 'scale(1.08)',
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
    
    const effect = effects[themeKey] || effects['clean-white'];
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

// Configuration constants
const CONFIG = {
  SLIDE_RENDER_WAIT: 2000,      // 2 seconds
  IMAGE_LOAD_TIMEOUT: 15000,    // 15 seconds  
  FINAL_RENDER_WAIT: 3000       // 3 seconds
};

export class DownloadService {
  static async download(
    format: 'pdf' | 'pptx' | 'html',
    presentationTitle: string,
    slides?: any[],
    theme?: any
  ) {
    try {
      let slideImages: string[] = [];
      if (format !== 'pptx') {
        // Screenshot logic for PDF/HTML only
        const slideElements = document.querySelectorAll('#slides-preview-container > div');
        
        if (slideElements.length === 0) {
          alert('No slides found to download.');
          return;
        }

        for (let i = 0; i < slideElements.length; i++) {
          const slideElement = slideElements[i] as HTMLElement;
          
          console.log(`Processing slide ${i + 1}/${slideElements.length}...`);
          
          // Scroll the slide into view
          slideElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          
          // Wait for rendering
          console.log('Waiting for slide to render...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Take screenshot directly from the preview slide
          console.log('Taking screenshot directly from preview...');
          
          // Hide interactive elements temporarily
          const interactiveElements = slideElement.querySelectorAll('button, .opacity-0, .group-hover\\:opacity-100');
          const originalDisplays: string[] = [];
          interactiveElements.forEach((el, index) => {
            if (el instanceof HTMLElement) {
              originalDisplays[index] = el.style.display;
              el.style.display = 'none';
            }
          });
          
          // Wait for images to load completely
          console.log('Waiting for images to load...');
          await this.waitForImagesToLoad(slideElement);
          
          // Force layout recalculation
          slideElement.offsetHeight;
          
          // Take screenshot directly from the original slide
          const canvas = await html2canvas(slideElement, {
            scale: format === 'pptx' ? 0.5 : 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: 'transparent',
            logging: false,
            ignoreElements: (element) => {
              // Ignore interactive elements
              return element.classList.contains('opacity-0') || 
                     element.style.display === 'none' ||
                     element.style.visibility === 'hidden' ||
                     element.tagName === 'BUTTON';
            }
          });
          let dataUrl = canvas.toDataURL('image/png');
          // For PPTX, compress the PNG further by drawing to a smaller canvas and re-encoding
          if (format === 'pptx') {
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = Math.floor(canvas.width * 0.7);
            tmpCanvas.height = Math.floor(canvas.height * 0.7);
            const ctx = tmpCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
              dataUrl = tmpCanvas.toDataURL('image/png', 0.7); // Lower quality
            }
          }
          // Warn if image is too large for pptxgenjs
          if (format === 'pptx' && dataUrl.length > 1.2 * 1024 * 1024) {
            alert(`Slide ${i + 1} is too large to export to PowerPoint and will be skipped. Try reducing content or images.`);
            continue;
          }
          slideImages.push(dataUrl);
          
          console.log(`✅ Captured slide ${i + 1}/${slideElements.length} with ${slideElement.querySelectorAll('img').length} images`);
        }
      }

      if (format === 'pdf') {
        // Create PDF with each slide as a separate page
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < slideImages.length; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          const imgProps = pdf.getImageProperties(slideImages[i]);
          const imgWidth = pageWidth;
          const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
          
          // Center the image on the page
          const yOffset = (pageHeight - imgHeight) / 2;
          pdf.addImage(slideImages[i], 'PNG', 0, yOffset, imgWidth, imgHeight);
        }
        
        pdf.save(`${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        
      } else if (format === 'pptx') {
        if (!slides || !theme) {
          alert('Editable PPTX export requires slide data and theme.');
          return;
        }
        const pptx = new pptxgen();
        pptx.author = 'NewGamma AI';
        pptx.company = 'NewGamma';
        pptx.title = presentationTitle;
        pptx.subject = 'AI Generated Presentation';
        pptx.defineLayout({ name: '16x9', width: 13.33, height: 7.5 });
        pptx.layout = '16x9';
        pptx.defineSlideMaster({ title: 'MASTER_SLIDE', objects: ['title', 'body'] });
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          console.log('Exporting slide', i, 'with theme:', theme);
          const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          // --- Background ---
          let bgColor = theme?.colors?.background || '#FFFFFF';
          pptxSlide.background = { color: bgColor.replace('#', '') };
          // --- Text Color ---
          let textColor = theme?.colors?.text || '#000000';
          if (theme.textGradient && Array.isArray(theme.textGradient) && theme.textGradient.length > 0) {
            textColor = theme.textGradient[0];
          }
          textColor = textColor.replace('#', '');
          console.log('Using textColor for PPTX:', textColor);
          // --- Layout ---
          const layout = slide.layout || 'image-left';
          let titleBox = { x: 7, y: 1, w: 5.5, h: 1.2 };
          let bulletsBox = { x: 7, y: 2.5, w: 5.5, h: 4.5 };
          let imageBox = { x: 0.5, y: 1, w: 5.5, h: 5.5 };
          let showTitle = true, showBullets = true, showImage = !!(slide.image && slide.image.url);
          let overlayText = false;
          switch (layout) {
            case 'image-right':
              imageBox = { x: 7.33, y: 1, w: 5.5, h: 5.5 };
              titleBox = { x: 1, y: 1, w: 5.5, h: 1.2 };
              bulletsBox = { x: 1, y: 2.5, w: 5.5, h: 4.5 };
              break;
            case 'image-top':
              imageBox = { x: 1, y: 0.5, w: 11.33, h: 2 };
              titleBox = { x: 1, y: 3, w: 11.33, h: 1 };
              bulletsBox = { x: 1, y: 4.2, w: 11.33, h: 2.8 };
              break;
            case 'image-bottom':
              titleBox = { x: 1, y: 0.5, w: 11.33, h: 1 };
              bulletsBox = { x: 1, y: 1.7, w: 11.33, h: 2.5 };
              imageBox = { x: 1, y: 4.5, w: 11.33, h: 2 };
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
          // --- Add Content ---
          // Title
          let titleFontSize = 32;
          if (slide.title && slide.title.length > 40) titleFontSize = 24;
          // Bullets
          let bulletFontSize = 20;
          if (slide.bullets && slide.bullets.length > 5) bulletFontSize = 16;
          // Add image
          if (showImage && slide.image && slide.image.url) {
            try {
              let imagePath = slide.image.url;
              if (imagePath.startsWith('http')) {
                const response = await fetch(imagePath, { mode: 'cors', credentials: 'omit' });
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                const blob = await response.blob();
                const dataUrl = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error('Failed to read image data'));
                  reader.readAsDataURL(blob);
                });
                
                // Apply image effects for export (simplified version for download service)
                const processedImageUrl = await applyImageEffectForExport(dataUrl, theme?.key || 'clean-white', layout);
                
                pptxSlide.addImage({ 
                  data: processedImageUrl, 
                  ...imageBox,
                  sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
                });
              } else {
                // Apply image effects for local images too
                const processedImageUrl = await applyImageEffectForExport(imagePath, theme?.key || 'clean-white', layout);
                
                pptxSlide.addImage({ 
                  data: processedImageUrl, 
                  ...imageBox,
                  sizing: { type: 'contain', w: imageBox.w, h: imageBox.h }
                });
              }
            } catch (error) {
              pptxSlide.addText('AI Generated Image', { ...imageBox, fontSize: 14, color: '666666', align: 'center', valign: 'middle', fill: { color: 'F0F0F0' } });
            }
          }
          // Add title
          if (showTitle && slide.title && !overlayText) {
            // For text-only layout, use larger font size
            let adjustedTitleFontSize = titleFontSize;
            if (layout === 'text-only') {
              adjustedTitleFontSize = titleFontSize + 8;
            }
            
            pptxSlide.addText(slide.title, {
              ...titleBox,
              fontSize: adjustedTitleFontSize,
              fontFace: 'Arial',
              bold: true,
              color: textColor,
              align: 'left',
              valign: 'top'
            });
          }
          // Add bullets
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
                  fontSize: bulletFontSize,
                  fontFace: 'Arial',
                  color: textColor,
                  align: 'left',
                  valign: 'top',
                  bullet: { type: 'number', startAt: index + 1 }
                });
              });
            } else {
              // For other layouts, use the original approach
              pptxSlide.addText(slide.bullets.join('\n'), {
                ...bulletsBox,
                fontSize: bulletFontSize,
                fontFace: 'Arial',
                color: textColor,
                align: 'left',
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
                fontSize: titleFontSize + 4,
                fontFace: 'Arial',
                bold: true,
                color: 'ffffff',
                align: 'center',
                valign: 'top'
              });
              overlayY += 1.3;
            }
            if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
              pptxSlide.addText(slide.bullets.join('\n'), {
                x: 1, y: overlayY, w: 11.33, h: 3,
                fontSize: bulletFontSize + 2,
                fontFace: 'Arial',
                color: 'ffffff',
                align: 'center',
                valign: 'top',
                bullet: true
              });
            }
          }
          // Add SVG elements as images
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
        await pptx.writeFile({ fileName: `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}_gamma.pptx` });
        return;
      } else if (format === 'html') {
        // Create HTML with each slide as a separate section
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${presentationTitle}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #f5f5f5;
        }
        .slide {
            width: 100%;
            max-width: 800px;
            margin: 20px auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        .slide img {
            width: 100%;
            height: auto;
            display: block;
        }
        .slide-number {
            background: #333;
            color: white;
            padding: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
        }
        @media print {
            .slide {
                page-break-after: always;
                margin: 0;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    ${slideImages.map((image, index) => `
    <div class="slide">
        <div class="slide-number">Slide ${index + 1} of ${slideImages.length}</div>
        <img src="${image}" alt="Slide ${index + 1}">
    </div>
    `).join('')}
</body>
</html>`;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      console.log(`Successfully created ${format.toUpperCase()} with ${slideImages.length} slides`);
      
    } catch (error) {
      console.error('Error during download:', error);
      alert('Error creating download. Please try again.');
    }
  }

  /**
   * Convert all cross-origin images in a specific element to data URLs
   * This ensures HTML2Canvas can capture them properly
   */
  private static async convertImagesInElement(element: HTMLElement): Promise<void> {
    try {
      const images = element.querySelectorAll('img');
      const conversionPromises: Promise<void>[] = [];

      images.forEach((img) => {
        const imgElement = img as HTMLImageElement;
        const src = imgElement.src;
        
        // Only convert if it's a cross-origin image (server URL)
        if (src && (src.includes('localhost:3002') || src.includes('http'))) {
          const promise = this.convertImageToDataUrl(imgElement);
          conversionPromises.push(promise);
        }
      });

      if (conversionPromises.length > 0) {
        console.log(`Converting ${conversionPromises.length} images in element to data URLs...`);
        await Promise.all(conversionPromises);
        console.log('Element image conversion completed');
      }
    } catch (error) {
      console.error('Error converting images in element to data URLs:', error);
    }
  }

  /**
   * Convert a single image to data URL using fetch to avoid CORS issues
   */
  private static async convertImageToDataUrl(imgElement: HTMLImageElement): Promise<void> {
    try {
      console.log('Converting image:', imgElement.src);
      
      // Try direct fetch first
      try {
        const response = await fetch(imgElement.src);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Convert blob to data URL
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        
        // Update the image source
        imgElement.src = dataUrl;
        console.log('Successfully converted image to data URL via direct fetch');
        return;
      } catch (fetchError) {
        console.warn('Direct fetch failed, trying server endpoint:', fetchError);
      }
      
      // Fallback: Use server endpoint to get data URL
      if (imgElement.src.includes('/api/images/')) {
        const filename = imgElement.src.split('/api/images/')[1];
        const dataUrlResponse = await fetch(`http://localhost:3002/api/images/${filename}/dataurl`);
        
        if (dataUrlResponse.ok) {
          const data = await dataUrlResponse.json();
          imgElement.src = data.dataUrl;
          console.log('Successfully converted image to data URL via server endpoint');
        } else {
          throw new Error('Server endpoint failed');
        }
      } else {
        throw new Error('Image URL not supported for conversion');
      }
    } catch (error) {
      console.warn('Failed to convert image to data URL:', error);
      // Continue even if one image fails
    }
  }

  /**
   * Wait for all images in an element to load completely
   */
  private static async waitForImagesToLoad(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    if (images.length === 0) {
      console.log('No images found in element, proceeding...');
      return;
    }

    console.log(`Waiting for ${images.length} images to load...`);
    
    const imagePromises = Array.from(images).map((img) => {
      const imgElement = img as HTMLImageElement;
      
      return new Promise<void>((resolve) => {
        // If image is already loaded
        if (imgElement.complete && imgElement.naturalHeight !== 0) {
          console.log('Image already loaded:', imgElement.src);
          resolve();
          return;
        }
        
        // Wait for image to load
        const onLoad = () => {
          console.log('Image loaded successfully:', imgElement.src);
          imgElement.removeEventListener('load', onLoad);
          imgElement.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          console.warn('Image failed to load:', imgElement.src);
          imgElement.removeEventListener('load', onLoad);
          imgElement.removeEventListener('error', onError);
          resolve(); // Continue even if image fails
        };
        
        imgElement.addEventListener('load', onLoad);
        imgElement.addEventListener('error', onError);
        
        // Fallback timeout (increase from 10000ms to 15000ms)
        setTimeout(() => {
          console.warn('Image load timeout:', imgElement.src);
          imgElement.removeEventListener('load', onLoad);
          imgElement.removeEventListener('error', onError);
          resolve();
        }, 15000);
      });
    });
    
    await Promise.all(imagePromises);
    console.log('All images loaded or timed out');
    
    // Additional wait to ensure rendering is complete (increase from 2000ms to 3000ms)
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
} 