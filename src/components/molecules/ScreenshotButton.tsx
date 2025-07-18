import { useState } from 'react';
import Button from '../atoms/Button';
import { ScreenshotService } from '../../services/screenshot';

interface ScreenshotButtonProps {
  containerId: string;
  presentationTitle: string;
  disabled?: boolean;
  className?: string;
}

const ScreenshotButton = ({ 
  containerId, 
  presentationTitle, 
  disabled = false,
  className = ''
}: ScreenshotButtonProps) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScreenshot = async () => {
    if (disabled || isCapturing) return;

    setIsCapturing(true);
    try {
      // Capture the presentation preview
      const dataUrl = await ScreenshotService.capturePresentationPreview(containerId, presentationTitle);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `${presentationTitle.replace(/[^a-zA-Z0-9]/g, '_')}_preview_${timestamp}.png`;
      
      // Download the screenshot
      ScreenshotService.downloadScreenshot(dataUrl, filename);
      
      // Also save to server uploads folder
      try {
        await ScreenshotService.saveScreenshotToServer(dataUrl, filename);
        console.log('Screenshot saved to server uploads folder');
      } catch (error) {
        console.warn('Failed to save screenshot to server:', error);
        // Don't fail the whole operation if server save fails
      }
      
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      alert('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleScreenshot}
      disabled={disabled || isCapturing}
      loading={isCapturing}
      className={`flex items-center gap-2 ${className}`}
    >
      📸 {isCapturing ? 'Capturing...' : 'Screenshot'}
    </Button>
  );
};

export default ScreenshotButton; 