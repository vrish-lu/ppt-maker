import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';

// Configuration constants
const CONFIG = {
  SLIDE_RENDER_WAIT: 2000,      // 2 seconds
  IMAGE_LOAD_TIMEOUT: 15000,    // 15 seconds  
  FINAL_RENDER_WAIT: 3000       // 3 seconds
};

export class DownloadService {
  static async download(
    format: 'pdf' | 'pptx' | 'html',
    presentationTitle: string
  ) {
    try {
      // Get all slide elements
      const slideElements = document.querySelectorAll('#slides-preview-container > div');
      
      if (slideElements.length === 0) {
        alert('No slides found to download.');
        return;
      }

      // Take screenshots of each slide individually
      const slideImages: string[] = [];
      
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
          scale: 2,
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
        
        // Restore interactive elements
        interactiveElements.forEach((el, index) => {
          if (el instanceof HTMLElement) {
            el.style.display = originalDisplays[index] || '';
          }
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        slideImages.push(dataUrl);
        
        console.log(`✅ Captured slide ${i + 1}/${slideElements.length} with ${slideElement.querySelectorAll('img').length} images`);
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
        // Create PPTX with each slide as a separate slide
        const pptx = new pptxgen();
        // Use 16:9 aspect ratio (13.33 x 7.5 inches)
        pptx.defineLayout({ name: '16x9', width: 13.33, height: 7.5 });
        pptx.layout = '16x9';
        
        for (let i = 0; i < slideImages.length; i++) {
          const slide = pptx.addSlide();
          
          // Add a background fill to ensure no blank space
          slide.background = { color: 'FFFFFF' };
          
          // Add a background rectangle to fill the entire slide
          slide.addShape('rect', {
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
            fill: { color: 'FFFFFF' }
          });
          
          // Add the slide image to fill the entire slide area
          slide.addImage({
            data: slideImages[i],
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
            sizing: {
              type: 'cover',
              w: 13.33,
              h: 7.5
            }
          });
        }
        
        await pptx.writeFile({ fileName: `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pptx` });
        
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
        if (src && (src.includes('localhost:3001') || src.includes('http'))) {
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
        const dataUrlResponse = await fetch(`http://localhost:3001/api/images/${filename}/dataurl`);
        
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