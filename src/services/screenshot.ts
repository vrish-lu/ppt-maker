import html2canvas from 'html2canvas';

export class ScreenshotService {
  /**
   * Takes a screenshot of a specific slide element
   */
  static async captureSlide(element: HTMLElement, _slideTitle: string): Promise<string> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture slide screenshot:', error);
      throw error;
    }
  }

  /**
   * Takes a screenshot of the entire presentation preview
   */
  static async capturePresentationPreview(containerId: string, _presentationTitle: string): Promise<string> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    try {
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: container.scrollWidth,
        height: container.scrollHeight
      });
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to capture presentation preview:', error);
      throw error;
    }
  }

  /**
   * Downloads a screenshot as a file
   */
  static downloadScreenshot(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Saves screenshot to server uploads folder
   */
  static async saveScreenshotToServer(dataUrl: string, filename: string): Promise<string> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('screenshot', blob, filename);
      
      // Send to server
      const uploadResponse = await fetch('/api/save-screenshot', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to save screenshot to server');
      }
      
      const result = await uploadResponse.json();
      return result.filePath;
    } catch (error) {
      console.error('Failed to save screenshot to server:', error);
      throw error;
    }
  }
} 